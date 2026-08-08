<template>
    <th :style="{ ...$attrs.style, position: 'relative' }">
        <slot />
        <span
            v-if="$attrs.width"
            class="resize-bar"
            @mousedown.prevent.stop="onDrag"
        />
    </th>
</template>

<script setup>
const emit = defineEmits(["resize"]);

const onDrag = (e) => {
    const startX = e.clientX;
    const thEl = e.target.parentElement;
    const startWidth = thEl.offsetWidth;

    const move = (ev) => {
        const w = Math.max(60, startWidth + ev.clientX - startX);
        thEl.style.width = w + "px";
    };
    const up = (ev) => {
        const w = Math.max(60, startWidth + ev.clientX - startX);
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        emit("resize", w);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
};
</script>

<style scoped>
.resize-bar {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: col-resize;
    z-index: 1;
}
.resize-bar:hover {
    background: rgba(24, 144, 255, 0.15);
}
</style>
