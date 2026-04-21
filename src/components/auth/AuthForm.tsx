/**
 * AuthForm — 이메일/비밀번호 입력 폼 (login/signup 공용)
 *
 * 책임: 입력 수집, 클라이언트 검증(zod), 제출 위임.
 * 책임 아님: 실제 signIn/signUp API 호출, 라우팅, 세션 분기.
 *   └ 상위 화면(app/auth/login.tsx, app/auth/signup.tsx)이 담당.
 */

import { useState } from 'react';

import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';

// ============================================================
// Schemas
// ============================================================

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
});

const signupSchema = z
  .object({
    email: z.string().email('올바른 이메일을 입력해주세요'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  });

// 폼 내부 필드 상위집합(superset) — login 모드에선 passwordConfirm은 렌더 안 됨.
type FormValues = z.infer<typeof signupSchema>;

// 상위에 노출되는 값은 email/password만 (passwordConfirm은 내부 검증용)
export interface AuthFormValues {
  email: string;
  password: string;
}

// ============================================================
// Props
// ============================================================

export interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (values: AuthFormValues) => Promise<void>;
  loading?: boolean;
}

// ============================================================
// Component
// ============================================================

export function AuthForm({ mode, onSubmit, loading = false }: AuthFormProps) {
  const isSignup = mode === 'signup';
  const [formError, setFormError] = useState<string | null>(null);

  // Resolver 캐스팅 사유:
  //   useForm<FormValues>는 FormValues(=signupSchema 추론) 기준이지만,
  //   login 모드에선 loginSchema(필드 2개)를 resolver로 넘긴다.
  //   런타임 검증은 loginSchema가 올바르게 수행 — 타입만 유니온 해결이 불가해
  //   resolver 경계에서만 명시적 캐스팅. 나머지 필드/errors/submit 타입은
  //   FormValues로 안전하게 유지된다.
  const resolver = zodResolver(
    isSignup ? signupSchema : loginSchema,
  ) as unknown as Resolver<FormValues>;

  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
    },
    mode: 'onBlur',
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const submit = async (values: FormValues) => {
    setFormError(null);
    try {
      await onSubmit({ email: values.email, password: values.password });
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setFormError(message);
    }
  };

  const submitLabel = isSignup ? '가입하기' : '로그인';
  const isDisabled = loading;

  return (
    <View className="w-full">
      {formError ? (
        <View className="mb-4 rounded-md border border-accent-sienna bg-bg-muted dark:bg-bg-muted-dark px-3 py-2">
          <Text className="font-body text-sm text-accent-sienna">{formError}</Text>
        </View>
      ) : null}

      {/* Email */}
      <View className="mb-3">
        <Text className="font-body text-sm text-ink-secondary dark:text-ink-secondary-dark mb-1">
          이메일
        </Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="you@example.com"
              placeholderTextColor="#8A7A63"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!isDisabled}
              className="font-body text-base text-ink-primary dark:text-ink-primary-dark bg-bg-surface dark:bg-bg-surface-dark border border-border-subtle dark:border-border-subtle-dark rounded-md px-3 py-3"
            />
          )}
        />
        {errors.email ? (
          <Text className="font-body text-xs text-accent-sienna mt-1">{errors.email.message}</Text>
        ) : null}
      </View>

      {/* Password */}
      <View className="mb-3">
        <Text className="font-body text-sm text-ink-secondary dark:text-ink-secondary-dark mb-1">
          비밀번호
        </Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="8자 이상"
              placeholderTextColor="#8A7A63"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              textContentType={isSignup ? 'newPassword' : 'password'}
              editable={!isDisabled}
              className="font-body text-base text-ink-primary dark:text-ink-primary-dark bg-bg-surface dark:bg-bg-surface-dark border border-border-subtle dark:border-border-subtle-dark rounded-md px-3 py-3"
            />
          )}
        />
        {errors.password ? (
          <Text className="font-body text-xs text-accent-sienna mt-1">
            {errors.password.message}
          </Text>
        ) : null}
      </View>

      {/* Password confirm (signup only) */}
      {isSignup ? (
        <View className="mb-4">
          <Text className="font-body text-sm text-ink-secondary dark:text-ink-secondary-dark mb-1">
            비밀번호 확인
          </Text>
          <Controller
            control={control}
            name="passwordConfirm"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="한 번 더 입력"
                placeholderTextColor="#8A7A63"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                textContentType="newPassword"
                editable={!isDisabled}
                className="font-body text-base text-ink-primary dark:text-ink-primary-dark bg-bg-surface dark:bg-bg-surface-dark border border-border-subtle dark:border-border-subtle-dark rounded-md px-3 py-3"
              />
            )}
          />
          {errors.passwordConfirm ? (
            <Text className="font-body text-xs text-accent-sienna mt-1">
              {errors.passwordConfirm.message}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSubmit(submit)}
        disabled={isDisabled}
        activeOpacity={0.8}
        className={`rounded-md py-3 items-center bg-ink-primary dark:bg-ink-primary-dark ${
          isDisabled ? 'opacity-50' : ''
        }`}
      >
        <Text className="font-body text-base font-semibold text-ink-on-accent dark:text-bg-page-dark">
          {isDisabled ? '처리 중…' : submitLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
