import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CallWithDetails } from "@shared/schema";

interface CallLogsTableProps {
  onSelectCall: (call: CallWithDetails) => void;
  selectedCall: CallWithDetails | null;
}

export default function CallLogsTable({ onSelectCall, selectedCall }: CallLogsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: calls = [], isLoading } = useQuery<CallWithDetails[]>({
    queryKey: ["/api/calls"],
  });

  const filteredCalls = calls.filter((call) => {
    const matchesSearch = !searchQuery || 
      call.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.patientId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || call.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getSentimentBadge = (label: string) => {
    switch (label) {
      case "crisis":
        return "bg-destructive text-destructive-foreground";
      case "distress":
        return "bg-amber-100 text-amber-800";
      case "positive":
        return "bg-secondary/10 text-secondary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSentimentProgress = (score: string) => {
    const numScore = parseFloat(score || "0");
    return Math.max(0, Math.min(100, (numScore + 1) * 50)); // Convert -1 to 1 scale to 0 to 100
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading call logs...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Call Logs</CardTitle>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-calls"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="crisis">Crisis</SelectItem>
                <SelectItem value="distress">Distress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Patient</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Call Time</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Duration</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Sentiment</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Flags</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCalls.map((call) => {
                const isCrisis = call.status === "crisis" || call.flags.some(flag => flag.severity === "high");
                const isSelected = selectedCall?.id === call.id;
                
                return (
                  <tr 
                    key={call.id} 
                    className={cn(
                      "hover:bg-muted/50 transition-colors cursor-pointer",
                      isCrisis && "bg-destructive/5 border-l-4 border-destructive",
                      isSelected && "bg-accent"
                    )}
                    onClick={() => onSelectCall(call)}
                    data-testid={`row-call-${call.id}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <span className="font-medium text-sm text-muted-foreground">
                            {call.patient?.name?.split(' ').map(n => n[0]).join('') || 'UN'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground" data-testid={`text-patient-name-${call.id}`}>
                            {call.patient?.name || "Unknown Patient"}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-patient-id-${call.id}`}>
                            {call.patientId || "Unknown ID"}
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4 text-sm text-foreground" data-testid={`text-call-time-${call.id}`}>
                      {call.timestamp ? new Date(call.timestamp).toLocaleString() : "Unknown"}
                    </td>
                    
                    <td className="p-4 text-sm text-foreground" data-testid={`text-duration-${call.id}`}>
                      {call.duration ? formatDuration(call.duration) : "Unknown"}
                    </td>
                    
                    <td className="p-4">
                      <Badge 
                        className={getSentimentBadge(call.sentimentLabel || "neutral")}
                        data-testid={`badge-status-${call.id}`}
                      >
                        {call.status || "Unknown"}
                      </Badge>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={getSentimentProgress(call.sentimentScore || "0")} 
                          className="w-16 h-2"
                        />
                        <span className="text-sm font-medium" data-testid={`text-sentiment-${call.id}`}>
                          {call.sentimentLabel || "Unknown"}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {call.flags.map((flag) => (
                          <Badge 
                            key={flag.id}
                            variant={flag.severity === "high" ? "destructive" : "outline"}
                            className="text-xs"
                            data-testid={`badge-flag-${flag.id}`}
                          >
                            {flag.flagType}
                          </Badge>
                        ))}
                        {call.flags.length === 0 && (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCall(call);
                        }}
                        data-testid={`button-view-call-${call.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
              
              {filteredCalls.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {searchQuery || statusFilter !== "all" 
                      ? "No calls match your search criteria" 
                      : "No call logs available"
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
