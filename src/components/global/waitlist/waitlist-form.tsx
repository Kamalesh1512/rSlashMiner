'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'


const emailFormSchema = z.object({
  email:z.string().email({message:"Invalid Email address"})
})

export function WaitlistForm() {

  const [email, setEmail] = useState('')

  const form = useForm<z.infer <typeof emailFormSchema>>({
    resolver:zodResolver(emailFormSchema),
    defaultValues:{
      email:''
    }
  })

  const  isLoading = form.formState.isSubmitting;

  const onSubmit = async (value : z.infer<typeof emailFormSchema>) => {

    try {
      const response = await axios.post('/api/user/waitlist', {
        email:value.email
      })

      toast.success("Success You are added To Waitlist!",{
        description: `${response.data.message}.`,
      })
    } catch (error) {
      toast.error("Error",{
        description: "Failed to join the waitlist. Please try again.",
      })
    }
  }

  return (
    <div className='mt-5 p-5'>
      <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-flow-col space-x-4">
      <FormField control={form.control}
          name="email"
          render={({field}) => (
            <FormItem>
                <FormControl>
                  <Input
                  className="bg-background"
                  placeholder="Enter Your Email" 
                  disabled={isLoading}
                  {...field} />
                </FormControl>
              <FormMessage/>
            </FormItem>
              )}/>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Joining...' : 'Join Waitlist!'}
      </Button>
      
      </div>
      
      </form>
     </Form>
  </div>
  )
}

