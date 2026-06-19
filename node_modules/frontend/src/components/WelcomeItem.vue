<template>
  <div class="item">
    <i>
      <slot name="icon"></slot>
    </i>
    <div class="details">
      <h3>
        <slot name="heading"></slot>
      </h3>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.item {
  @apply mt-[2rem] flex relative;
}

.details {
  @apply flex-1 ml-[1rem];
}

i {
  @apply flex items-center justify-center w-[32px] h-[32px] text-[var(--color-text)];
}

h3 {
  @apply text-[1.2rem] font-medium mb-[0.4rem] text-[var(--color-heading)];
}

@media (min-width: 1024px) {
  .item {
    @apply mt-0 pt-[0.4rem] pb-[1rem];
    padding-left: calc(var(--section-gap) / 2);
  }

  i {
    @apply absolute border border-[var(--color-border)] bg-[var(--color-background)] rounded-[8px] w-[50px] h-[50px];
    top: calc(50% - 25px);
    left: -26px;
  }

  .item:before {
    content: ' ';
    @apply border-l border-[var(--color-border)] absolute left-0;
    bottom: calc(50% + 25px);
    height: calc(50% - 25px);
  }

  .item:after {
    content: ' ';
    @apply border-l border-[var(--color-border)] absolute left-0;
    top: calc(50% + 25px);
    height: calc(50% - 25px);
  }

  .item:first-of-type:before {
    display: none;
  }

  .item:last-of-type:after {
    display: none;
  }
}
</style>
