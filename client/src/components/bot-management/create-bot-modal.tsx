import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertBotSchema } from "@shared/schema";

const createBotFormSchema = z.object({
  name: z.string().min(1, "Bot name is required"),
  personality: z.array(z.string()).default([]),
  greeting: z.string().min(10, "Greeting must be at least 10 characters"),
  crisisKeywords: z.string(),
  openmicBotId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CreateBotFormData = z.infer<typeof createBotFormSchema>;

interface CreateBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const personalityOptions = [
  { id: "empathetic", label: "Empathetic" },
  { id: "calm", label: "Calm" },
  { id: "non-judgmental", label: "Non-judgmental" },
  { id: "professional", label: "Professional" },
  { id: "supportive", label: "Supportive" },
  { id: "patient", label: "Patient" },
];

export default function CreateBotModal({ isOpen, onClose }: CreateBotModalProps) {
  const { toast } = useToast();

  const form = useForm<CreateBotFormData>({
    resolver: zodResolver(createBotFormSchema),
    defaultValues: {
      name: "",
      personality: ["empathetic", "calm", "non-judgmental"],
      greeting: "Hello, thank you for calling. This is your Mental Wellness Assistant. To protect your privacy, this call is not being recorded for human review. Please provide your unique Patient ID to get started.",
      crisisKeywords: "suicidal, harm, hopeless, end it all",
      openmicBotId: "",
      isActive: true,
    },
  });

  const createBotMutation = useMutation({
    mutationFn: async (data: CreateBotFormData) => {
      // Transform the data to match the API expected format
      const transformedData = {
        name: data.name,
        personality: data.personality,
        greeting: data.greeting,
        crisisKeywords: data.crisisKeywords.split(',').map(s => s.trim()).filter(Boolean),
        openmicBotId: data.openmicBotId,
        isActive: data.isActive,
      };
      
      const response = await apiRequest("POST", "/api/bots", transformedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({
        title: "Bot created successfully",
        description: "Your new mental health assistant is ready to help patients.",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to create bot",
        description: error.message || "An error occurred while creating the bot.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateBotFormData) => {
    createBotMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Mental Health Bot</DialogTitle>
          <DialogDescription>
            Configure your AI agent for patient triage and mental wellness assistance
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Mental Wellness Assistant v3.0" 
                      {...field} 
                      data-testid="input-bot-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personality"
              render={() => (
                <FormItem>
                  <FormLabel>Personality Traits</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {personalityOptions.map((option) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="personality"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, option.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== option.id
                                          )
                                        )
                                  }}
                                  data-testid={`checkbox-personality-${option.id}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="greeting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Greeting</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter custom greeting message..."
                      className="min-h-[100px]"
                      {...field}
                      data-testid="textarea-bot-greeting"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="crisisKeywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crisis Keywords</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="suicidal, harm, hopeless, end it all"
                      {...field}
                      value={field.value || ''}
                      data-testid="input-crisis-keywords"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Comma-separated keywords that will trigger crisis protocols
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-6 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={createBotMutation.isPending}
                data-testid="button-cancel-bot-creation"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createBotMutation.isPending}
                data-testid="button-create-bot-submit"
              >
                {createBotMutation.isPending ? "Creating..." : "Create Bot"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
