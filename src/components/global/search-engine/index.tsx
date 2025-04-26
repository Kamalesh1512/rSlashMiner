'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

const SearchComponent = () => {

    const [searchQuery, setSearchQuery] = useState("")

      const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
    
        // if (!searchQuery.trim()) {
        //   setFilteredFaqs(faqs)
        //   return
        // }
    
        // const query = searchQuery.toLowerCase()
        // const filtered = faqs.filter(
        //   (item) => item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query),
        // )
    
        // setFilteredFaqs(filtered)
      }
  return (
    <div>
        
      {/* Search component */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-row items-center justify-between gap-2">
            <Input
              placeholder="Search for help..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" className="bg-black" size={'icon'}>
            <Search className="h-4 w-4 text-white"/>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SearchComponent