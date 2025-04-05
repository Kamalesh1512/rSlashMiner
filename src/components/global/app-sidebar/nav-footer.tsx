"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User, CreditCard } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface UserProps {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  subscriptionTier?: string
}

interface NavFooterProps {
  user?: UserProps
}

const NavFooter = ({ user }: NavFooterProps) => {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  const getSubscriptionBadge = () => {
    if (!user?.subscriptionTier) return null

    switch (user.subscriptionTier) {
      case "premium":
        return <Badge className="ml-2 bg-amber-500">Premium</Badge>
      case "pro":
        return <Badge className="ml-2">Pro</Badge>
      default:
        return <Badge className="ml-2 bg-muted text-muted-foreground">Free</Badge>
    }
  }

  return (
    <>
      <SidebarSeparator />
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton>
                <Avatar className="h-6 w-6 mr-2">
                  {user?.image ? (
                    <AvatarImage src={user.image} alt={user?.name || "User"} />
                  ) : (
                    <AvatarFallback>{user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{user?.name || "User"}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</span>
                </div>
                {getSubscriptionBadge()}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Subscription</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}

export default NavFooter

