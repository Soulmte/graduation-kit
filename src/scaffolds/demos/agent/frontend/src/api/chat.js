import { useUserStore } from "@/stores/user";

/**
 * 流式对话。
 *
 * 这里刻意不走 axios 也不用原生 EventSource，原因有两个：
 *   1. axios 实例设了 timeout: 10000，模型生成动辄几十秒，会被掐断；
 *      而且 axios 拿不到"边下边解析"的流，只能等全部结束。
 *   2. EventSource 无法自定义请求头，带不上 Authorization，
 *      会被后端 JwtInterceptor 直接拦掉，也只支持 GET。
 *
 * 所以用 fetch + ReadableStream 手动读、手动按 SSE 格式解析。
 *
 * @param {Object} payload            { agentId, conversationId, question }
 * @param {Object} handlers           事件回调
 * @param {Function} handlers.onMeta  拿到会话ID时触发
 * @param {Function} handlers.onTrace 某个节点执行完时触发
 * @param {Function} handlers.onDelta 模型吐出增量文本时触发（会调很多次）
 * @param {Function} handlers.onDone  全部完成时触发
 * @param {Function} handlers.onError 出错时触发
 * @returns {Function} 调用它可以中断这次对话
 */
export const streamChat = (payload, handlers = {}) => {
    const { onMeta, onTrace, onDelta, onDone, onError } = handlers;
    const controller = new AbortController();
    const userStore = useUserStore();

    const dispatch = (event, dataText) => {
        let data = {};
        try {
            data = JSON.parse(dataText);
        } catch {
            // 后端推的都是 JSON，解析失败说明数据被截断了，跳过这一帧
            return;
        }
        switch (event) {
            case "meta":
                onMeta?.(data);
                break;
            case "trace":
                onTrace?.(data);
                break;
            case "delta":
                onDelta?.(data.content || "");
                break;
            case "done":
                onDone?.(data);
                break;
            case "error":
                onError?.(data.message || "对话失败");
                break;
            default:
                break;
        }
    };

    // SSE 的文本帧格式是：event:xxx \n data:yyy \n\n
    // 一次 read() 拿到的字节未必刚好切在帧边界，
    // 所以用 buffer 缓存，只处理已经凑齐的完整帧（以空行结尾）。
    const parseFrames = (buffer) => {
        const frames = buffer.split("\n\n");
        // 最后一段可能是不完整的，留着下次接着拼
        const rest = frames.pop() ?? "";

        for (const frame of frames) {
            let event = "message";
            const dataLines = [];

            for (const line of frame.split("\n")) {
                if (line.startsWith("event:")) {
                    event = line.slice(6).trim();
                } else if (line.startsWith("data:")) {
                    dataLines.push(line.slice(5).trim());
                }
            }

            if (dataLines.length) {
                dispatch(event, dataLines.join("\n"));
            }
        }
        return rest;
    };

    const run = async () => {
        let response;
        try {
            response = await fetch("/api/chat/stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userStore.token}`,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
        } catch (e) {
            if (e.name !== "AbortError") {
                onError?.("连接失败，检查后端是否已启动");
            }
            return;
        }

        if (!response.ok) {
            onError?.(`请求失败（HTTP ${response.status}）`);
            return;
        }

        // 拦截器拦下来的请求不会进 Controller，返回的是 JSON 而不是事件流；
        // 参数校验失败走全局异常处理器，也是 JSON。这里按 JSON 解开报真正的原因。
        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.includes("text/event-stream")) {
            try {
                const res = await response.json();
                onError?.(res.message || "请求被拒绝");
            } catch {
                onError?.("响应格式不对，无法解析");
            }
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                // stream: true 很关键：一个中文字占三字节，
                // 可能被切在两次 read 之间，不加这个参数会出乱码。
                buffer += decoder.decode(value, { stream: true });
                buffer = parseFrames(buffer);
            }
        } catch (e) {
            if (e.name !== "AbortError") {
                onError?.("读取响应失败：" + e.message);
            }
        } finally {
            reader.releaseLock?.();
        }
    };

    run();
    return () => controller.abort();
};
