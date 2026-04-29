import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an admin
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        "Authorization": authHeader,
        "apikey": anonKey,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok || !userData.id) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the user is an admin
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userData.id}&select=role`, {
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
    });

    const profiles = await profileResponse.json();
    if (!profiles || profiles.length === 0 || profiles[0].role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admins can delete cashier accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { cashierId } = await req.json();

    if (!cashierId) {
      return new Response(
        JSON.stringify({ error: "Cashier ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the target is actually a cashier
    const targetProfileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${cashierId}&select=role`, {
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
    });

    const targetProfiles = await targetProfileResponse.json();
    if (!targetProfiles || targetProfiles.length === 0 || targetProfiles[0].role !== "cashier") {
      return new Response(
        JSON.stringify({ error: "Target user is not a cashier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete the auth user (this will cascade delete the profile via trigger)
    const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${cashierId}`, {
      method: "DELETE",
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      return new Response(
        JSON.stringify({ error: errorData.msg || "Failed to delete cashier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Cashier account deleted successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
