import { MessageSquare, Send, Users, FileText, Settings, BarChart3, UserPlus, History, Shield, HelpCircle, LayoutTemplate, Workflow, Clock, Upload, Layers, Target } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useClientAuth } from '@/hooks/useClientAuth';

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

const clientItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Send Message", url: "/send", icon: Send },
  { title: "Message History", url: "/messages", icon: History },
  { title: "Templates", url: "/templates", icon: LayoutTemplate },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Scheduled", url: "/scheduled", icon: Clock },
  { title: "Support", url: "/support", icon: HelpCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
  { title: "Client Management", url: "/admin/clients", icon: UserPlus },
  { title: "User Management", url: "/users", icon: Users },
  { title: "Support", url: "/support", icon: HelpCircle },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { admin } = useAdminAuth();
  const { client } = useClientAuth();

  const isAdmin = !!admin;
  const isClient = !!client;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>{isAdmin ? 'Admin Portal' : 'WhatsApp Hub'}</span>
            </div>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {isClient && clientItems.map((item) => (
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
              
              {isAdmin && adminItems.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  );
}