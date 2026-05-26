'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'
import { authClient } from '@/lib/auth-client'
import { Button } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Field, FieldError } from './ui/field'
import { Input } from './ui/input'
import { InputGroup, InputGroupButton, InputGroupInput } from './ui/input-group'
import { Label } from './ui/label'

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required!'),
  password: z.string().min(1, 'Password is required!'),
})

export function SignInPage() {
  const [show, setShow] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: z.infer<typeof signInSchema>) {
    await authClient.signIn
      .email({
        email: values.email,
        password: values.password,
      })
      .then((res) => {
        if (res.error) {
          form.setError('root', res.error)
          return
        }

        if (redirect) {
          router.replace(redirect)
        } else {
          router.refresh()
        }
      })
  }

  return (
    <section className="h-svh flex items-center justify-center">
      <form id="sign-in-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="min-w-sm">
          <CardHeader className="text-center">
            <CardTitle>Sign in to Tascboard</CardTitle>
            <CardDescription>
              Welcome back! please sign in to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field className="text-center">
              {form.formState.errors.root && (
                <FieldError errors={[form.formState.errors.root]} />
              )}
            </Field>
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field>
                  <Label>Email address</Label>
                  <Input placeholder="your@email.com" {...field} />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field>
                  <Label>Password</Label>
                  <InputGroup>
                    <InputGroupInput
                      type={show ? 'text' : 'password'}
                      {...field}
                    />
                    <InputGroupButton onClick={() => setShow(!show)}>
                      {show ? <RiEyeLine /> : <RiEyeOffLine />}
                    </InputGroupButton>
                  </InputGroup>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Field>
              <Button
                disabled={form.formState.isSubmitting}
                type="submit"
                form="sign-in-form"
                className={'w-full'}
              >
                {form.formState.isSubmitting ? 'Signing in...' : 'Continue'}
              </Button>
            </Field>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <p className="text-sm">
              {`Don't have an account? `}
              <Link
                href={'/sign-up'}
                className="hover:underline text-primary/80 hover:text-primary"
              >
                Create account
              </Link>
            </p>
            <p className="text-sm">
              {`Forgot password? `}
              <Link
                href={'/forgot-password'}
                className="hover:underline text-primary/80 hover:text-primary"
              >
                Reset it
              </Link>
            </p>
          </CardFooter>
        </Card>
      </form>
    </section>
  )
}
