<template>
  <div class="csvi-dynamic-input">
    <!-- Select Input for Enums -->
    <select
      v-if="inputType.type === 'select'"
      :value="String(value ?? '')"
      class="csvi-input"
      :class="{ 'csvi-input-error': hasError }"
      :aria-invalid="hasError ? 'true' : 'false'"
      :disabled="disabled"
      @change="handleInput"
    >
      <option value="">
        Select...
      </option>
      <option
        v-for="option in inputType.options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>

    <!-- Date Input -->
    <input
      v-else-if="inputType.type === 'date'"
      type="date"
      :value="formatDateForInput(value)"
      class="csvi-input"
      :class="{ 'csvi-input-error': hasError }"
      :aria-invalid="hasError ? 'true' : 'false'"
      :disabled="disabled"
      @input="handleInput"
    />

    <!-- Datetime Input -->
    <input
      v-else-if="inputType.type === 'datetime'"
      type="datetime-local"
      :value="formatDateTimeForInput(value)"
      class="csvi-input"
      :class="{ 'csvi-input-error': hasError }"
      :aria-invalid="hasError ? 'true' : 'false'"
      :disabled="disabled"
      @input="handleInput"
    />

    <!-- Number Input -->
    <input
      v-else-if="inputType.type === 'number'"
      type="number"
      :min="inputType.min"
      :max="inputType.max"
      :value="value"
      class="csvi-input"
      :class="{ 'csvi-input-error': hasError }"
      :aria-invalid="hasError ? 'true' : 'false'"
      :disabled="disabled"
      @input="handleInput"
    />

    <!-- Email Input -->
    <input
      v-else-if="inputType.type === 'email'"
      type="email"
      :value="String(value ?? '')"
      class="csvi-input"
      :class="{ 'csvi-input-error': hasError }"
      :aria-invalid="hasError ? 'true' : 'false'"
      :disabled="disabled"
      @input="handleInput"
    />

    <!-- Default Text Input -->
    <input
      v-else
      type="text"
      :value="String(value ?? '')"
      class="csvi-input"
      :class="{ 'csvi-input-error': hasError }"
      :aria-invalid="hasError ? 'true' : 'false'"
      :disabled="disabled"
      @input="handleInput"
    />
  </div>
</template>

<script lang="ts" setup>
import type { InputTypeInfo } from '../utils/inputTypeExtractor';

type Props = {
  value: unknown;
  inputType: InputTypeInfo;
  hasError: boolean;
  disabled?: boolean;
};

type Emits = (e: 'input', value: string) => void;

defineProps<Props>();
const emit = defineEmits<Emits>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  emit('input', target.value);
};

const formatDateForInput = (value: unknown): string => {
  if (!value) {
    return '';
  }

  try {
    const date = new Date(value as string);

    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const formatDateTimeForInput = (value: unknown): string => {
  if (!value) {
    return '';
  }

  try {
    const date = new Date(value as string);

    if (isNaN(date.getTime())) {
      return '';
    }

    // Format as YYYY-MM-DDTHH:MM
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};
</script>

<style lang="postcss" scoped>
.csvi-dynamic-input {
  @apply w-full;
}

.csvi-input {
  @apply w-full h-8 border border-slate-300 rounded text-sm px-2 bg-white m-0;
}

.csvi-input-error {
  @apply border-red-300 ring-1 ring-red-100;
}

/* Select specific styles */
select.csvi-input {
  @apply cursor-pointer leading-5 py-1 pr-8;
}

/* Date and datetime specific styles */
input[type='date'].csvi-input,
input[type='datetime-local'].csvi-input {
  @apply cursor-pointer;
}

/* Number specific styles */
input[type='number'].csvi-input {
  @apply cursor-text;
}

/* Email specific styles */
input[type='email'].csvi-input {
  @apply cursor-text;
}
</style>
