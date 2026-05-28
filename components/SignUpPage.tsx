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

const signUpSchema = z.object({
  name: z.string().min(2, 'Full name must be atleast 2 characters long!'),
  email: z.string().min(1, 'Email is required!'),
  password: z.string().min(1, 'Password is required!'),
})

export function SignUpPage() {
  const [show, setShow] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const signInHref = searchParams.toString()
    ? `/sign-in?${searchParams.toString()}`
    : '/sign-in'
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: z.infer<typeof signUpSchema>) {
    const res = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: redirect ?? '/',
    })

    if (res.error) {
      form.setError('root', res.error)
      return
    }

    router.replace(`/verify-email?email=${encodeURIComponent(values.email)}`)
  }

  return (
    <section className="h-svh flex items-center justify-center">
      <form id="sign-up-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="min-w-sm">
          <CardHeader className="text-center">
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Please setup an account to continue to Tascboard
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
              name="name"
              render={({ field, fieldState }) => (
                <Field>
                  <Label>Full Name</Label>
                  <Input placeholder="Walter White" {...field} />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field>
                  <Label>Email address</Label>
                  <Input placeholder="heisenberg@iwon.com" {...field} />
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
                form="sign-up-form"
                className={'w-full'}
              >
                {form.formState.isSubmitting
                  ? 'Creating account...'
                  : 'Continue'}
              </Button>
            </Field>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <p className="text-sm">
              {`Already have an account? `}
              <Link
                href={signInHref}
                className="hover:underline text-primary/80 hover:text-primary"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </form>
    </section>
  )
}
