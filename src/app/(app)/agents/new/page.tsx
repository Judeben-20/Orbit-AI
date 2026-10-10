"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AgentAvatar } from "@/components/ui/agent-avatar";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  instructions: z.string().max(1000).optional(),
});

export default function NewAgentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(7));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      instructions: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, avatarSeed }),
      });
      if (!response.ok) {
        throw new Error("Failed to create agent");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      router.push(`/agents/${data.id}`);
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(values);
  }

  const shuffleAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Create New Agent</h1>
        <p className="text-sm text-gray-500 mt-2">Design an AI agent to help you automate tasks and chat.</p>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex flex-col items-center mb-8 gap-4">
          <AgentAvatar seed={avatarSeed} size="lg" />
          <Button variant="outline" size="sm" onClick={shuffleAvatar} type="button">
            <Shuffle className="w-4 h-4 mr-2" />
            Shuffle Avatar
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Miki" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="You are a helpful assistant..." 
                      className="resize-none h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-right">
                    {field.value?.length || 0} / 1000
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
                {isPending ? "Creating..." : "Create Agent"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
