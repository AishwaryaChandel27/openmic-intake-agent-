import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCards from "@/components/dashboard/stats-cards";
import CallLogsTable from "@/components/dashboard/call-logs-table";
import CallDetailsSidebar from "@/components/dashboard/call-details-sidebar";
import CreateBotModal from "@/components/bot-management/create-bot-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CallWithDetails } from "@shared/schema";

export default function Dashboard() {
  const [selectedCall, setSelectedCall] = useState<CallWithDetails | null>(null);
  const [isCreateBotOpen, setIsCreateBotOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <Header onCreateBot={() => setIsCreateBotOpen(true)} />
          
          <StatsCards />
          
          <div className="flex-1 overflow-hidden">
            <div className="px-6">
              <Tabs defaultValue="calls" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="calls" data-testid="tab-call-logs">Call Logs</TabsTrigger>
                  <TabsTrigger value="bots" data-testid="tab-bot-management">Bot Management</TabsTrigger>
                  <TabsTrigger value="crisis" data-testid="tab-crisis-reports">Crisis Reports</TabsTrigger>
                </TabsList>
                
                <TabsContent value="calls" className="mt-6">
                  <CallLogsTable 
                    onSelectCall={setSelectedCall} 
                    selectedCall={selectedCall}
                  />
                </TabsContent>
                
                <TabsContent value="bots" className="mt-6">
                  <div className="bg-card rounded-lg border border-border p-6">
                    <p className="text-muted-foreground">Bot management content will be displayed here</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="crisis" className="mt-6">
                  <div className="bg-card rounded-lg border border-border p-6">
                    <p className="text-muted-foreground">Crisis reports content will be displayed here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {selectedCall && (
        <CallDetailsSidebar 
          call={selectedCall} 
          onClose={() => setSelectedCall(null)} 
        />
      )}

      <CreateBotModal 
        isOpen={isCreateBotOpen} 
        onClose={() => setIsCreateBotOpen(false)} 
      />
    </div>
  );
}
