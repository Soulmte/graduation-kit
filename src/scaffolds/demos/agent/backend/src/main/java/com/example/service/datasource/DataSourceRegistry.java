package com.example.service.datasource;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据源注册中心
 *
 * <p>构造时 Spring 会把容器里所有 {@link DataSourceProvider} 实现注进来，
 * 这里按 key 建索引。新增数据源只要写个 @Component，不用来这里登记。
 *
 * <p>为什么用 LinkedHashMap：下拉框的顺序要稳定，不然每次重启后
 * 选项顺序都不一样，配置的人会以为界面出问题了。
 */
@Slf4j
@Component
public class DataSourceRegistry {

    private final Map<String, DataSourceProvider> providers = new LinkedHashMap<>();

    public DataSourceRegistry(List<DataSourceProvider> beans) {
        for (DataSourceProvider p : beans) {
            DataSourceProvider dup = providers.put(p.key(), p);
            if (dup != null) {
                // 两个实现抢同一个 key，后注册的会把前面的顶掉，
                // 静默覆盖很难查，这里直接喊出来
                log.warn("数据源 key 重复：{}，{} 覆盖了 {}",
                        p.key(), p.getClass().getSimpleName(), dup.getClass().getSimpleName());
            }
        }
        log.info("已注册 {} 个数据源：{}", providers.size(), providers.keySet());
    }

    /**
     * 按 key 取数据源，没有返回 null（调用方负责给出友好报错）
     */
    public DataSourceProvider get(String key) {
        return key == null ? null : providers.get(key);
    }

    /**
     * 全部数据源，给管理端下拉框用
     */
    public List<DataSourceProvider> all() {
        return List.copyOf(providers.values());
    }
}
