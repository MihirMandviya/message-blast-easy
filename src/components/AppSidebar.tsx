import { MessageSquare, Send, Users, FileText, Settings, BarChart3, UserPlus, History, Shield, HelpCircle, Layout, Workflow, Clock, UsersIcon, Upload, Layers, Target } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const userItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Send Message", url: "/send", icon: Send },
  { title: "Message History", url: "/messages", icon: History },
  { title: "Templates", url: "/templates", icon: Layout },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Groups", url: "/groups", icon: Layers },
  { title: "Automation", url: "/flows", icon: Workflow },
  { title: "Scheduled", url: "/scheduled", icon: Clock },
  { title: "Campaigns", url: "/campaigns", icon: Target },
  { title: "Data Upload", url: "/upload", icon: Upload },
  { title: "Support", url: "/support", icon: HelpCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
  { title: "Client Management", url: "/users", icon: UserPlus },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAdmin } = useUserRole();

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp Dashboard</span>
            </div>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {userItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={({ isActive }) => 
                          isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"
                        }
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}