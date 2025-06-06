import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from "@/integrations/supabase/client"; // Import your Supabase client
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (session) {
        // User is signed in, redirect to home page
        navigate('/');
      }
    });

    // Clean up the listener on component unmount
    return () => {
      authListener.unsubscribe();
    };
  }, [navigate]); // Add navigate to dependency array

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700 p-4">
      <div className="w-full max-w-md">
        <Auth
          supabaseClient={supabase}
          providers={[]} // No third-party providers for now
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))', // Use your primary color
                  brandAccent: 'hsl(var(--primary-foreground))', // Use your primary foreground color
                },
              },
            },
          }}
          theme="light" // Use light theme, adjust if you have dark mode logic
          redirectTo={window.location.origin + '/'} // Redirect to home after login/signup
        />
      </div>
    </div>
  );
}

export default Login;