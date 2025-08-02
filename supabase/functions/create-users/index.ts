import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create users with admin privileges
    const users = [
      {
        email: 'admin@duran.com',
        password: 'admin123',
        name: 'Administrador',
        role: 'Admin'
      },
      {
        email: 'gerente@duran.com',
        password: 'gerente123',
        name: 'Gerente General',
        role: 'Gerente'
      },
      {
        email: 'empleado@duran.com',
        password: 'empleado123',
        name: 'Empleado',
        role: 'Empleado'
      }
    ]

    const results = []

    for (const userData of users) {
      // Create auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      })

      if (authError) {
        console.error(`Error creating auth user ${userData.email}:`, authError)
        results.push({ email: userData.email, success: false, error: authError.message })
        continue
      }

      // Create user profile
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
          auth_id: authUser.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        })

      if (profileError) {
        console.error(`Error creating user profile ${userData.email}:`, profileError)
        results.push({ email: userData.email, success: false, error: profileError.message })
      } else {
        results.push({ email: userData.email, success: true })
      }
    }

    return new Response(
      JSON.stringify({ results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})