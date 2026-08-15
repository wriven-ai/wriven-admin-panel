import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { useLogin } from './queries'

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof schema>

const DEMO_EMAIL = import.meta.env.VITE_DEMO_ADMIN_EMAIL as string | undefined
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_ADMIN_PASSWORD as string | undefined
const DEMO_AVAILABLE = Boolean(DEMO_EMAIL && DEMO_PASSWORD)

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: LoginValues) {
    await login.mutateAsync(values)
    navigate('/', { replace: true })
  }

  async function onQuickLogin() {
    if (!DEMO_EMAIL || !DEMO_PASSWORD) return
    await login.mutateAsync({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
    navigate('/', { replace: true })
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent">
          <Lock className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Wriven Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to the admin panel</p>
      </div>

      {/* Form card */}
      <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-lg)]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="admin@example.com"
              {...register('email')}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition-shadow focus:ring-2"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 pr-10 text-sm outline-none ring-ring transition-shadow focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* API error */}
          {login.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
              <p className="text-sm text-destructive">
                {login.error.message ?? 'Invalid credentials'}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || login.isPending}
          >
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {DEMO_AVAILABLE && (
          <div className="mt-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onQuickLogin}
              disabled={login.isPending}
            >
              {login.isPending ? 'Signing in…' : 'Quick login (Demo)'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
