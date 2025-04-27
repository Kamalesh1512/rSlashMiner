import { db } from '@/lib/db'
import { waitlist } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'


export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  
  const existingEmail=await db.select()
                         .from(waitlist)
                         .where(eq(waitlist.email,email))

  if (existingEmail.length===0) {
        try {
          const dbResult = await db.insert(waitlist)
                  .values({
                    email:email
                  }).returning({email:waitlist.email})
          return NextResponse.json({ message: dbResult[0].email })

    } 
    catch (error) {
      console.error('Error saving to db:', error)
      return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 })
    }
  }
  else{
    return NextResponse.json({ message: 'You are Already Responded' }, { status: 200 })
  }

}

