import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import CreateBotModal from "@/components/bot-management/create-bot-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Power, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Bot } from "@shared/schema";

export default function BotManagement() {
  const [isCreateBotOpen, setIsCreateBotOpen] = useState(false);
  const { toast } = useToast();

  const { data: bots = [], isLoading } = useQuery<Bot[]>({
    queryKey: ["/api/bots"],
  });

  const deleteBotMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/bots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({
        title: "Bot deleted",
        description: "The bot has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleBotMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/bots/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({
        title: "Bot updated",
        description: "Bot status has been updated.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading bots...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <Header onCreateBot={() => setIsCreateBotOpen(true)} />
          
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Bot Management</h2>
              <p className="text-muted-foreground">Manage your AI mental health assistants</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.map((bot) => (
                <Card key={bot.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{bot.name}</CardTitle>
                      <div className="flex items-center space-x-1">
                        {bot.isActive ? (
                          <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                            <Power className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <PowerOff className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Personality Traits</p>
                        <div className="flex flex-wrap gap-1">
                          {bot.personality?.map((trait, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Greeting</p>
                        <p className="text-xs text-foreground line-clamp-3">
                          {bot.greeting || "No greeting configured"}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Crisis Keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {bot.crisisKeywords?.slice(0, 3).map((keyword, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {(bot.crisisKeywords?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(bot.crisisKeywords?.length || 0) - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleBotMutation.mutate({ 
                              id: bot.id, 
                              isActive: !bot.isActive 
                            })}
                            disabled={toggleBotMutation.isPending}
                            data-testid={`button-toggle-bot-${bot.id}`}
                          >
                            {bot.isActive ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-edit-bot-${bot.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteBotMutation.mutate(bot.id)}
                          disabled={deleteBotMutation.isPending}
                          data-testid={`button-delete-bot-${bot.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {bots.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <div className="text-muted-foreground text-center">
                    <p className="text-lg mb-2">No bots created yet</p>
                    <p className="text-sm mb-4">Create your first mental health assistant to get started</p>
                    <Button onClick={() => setIsCreateBotOpen(true)} data-testid="button-create-first-bot">
                      Create Your First Bot
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <CreateBotModal 
        isOpen={isCreateBotOpen} 
        onClose={() => setIsCreateBotOpen(false)} 
      />
    </div>
  );
}
