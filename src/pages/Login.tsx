
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CardContainer } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email è obbligatoria")
    .email("Inserisci un'email valida"),
  password: z.string().min(1, "La password è obbligatoria"),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      // In a real app, this would connect to your authentication backend
      console.log("Login attempt with:", values);
      
      // Simulate login success
      toast({
        title: "Accesso effettuato",
        description: "Benvenuto nel gestionale affitti",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Errore di accesso",
        description: "Email o password non validi",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Gestionale Affitti</h1>
          <p className="text-muted-foreground mt-2">
            Accedi al tuo account per continuare
          </p>
        </div>

        <CardContainer className="animate-fade-in">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <LogIn className="mr-2 h-6 w-6" /> Accedi
          </h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="la-tua-email@esempio.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Inserisci la tua password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full mt-6">
                Accedi
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Non hai un account?{" "}
              <Link
                to="/register"
                className="text-primary font-medium hover:underline"
              >
                Registrati
              </Link>
            </p>
          </div>
        </CardContainer>
      </div>
    </div>
  );
}
