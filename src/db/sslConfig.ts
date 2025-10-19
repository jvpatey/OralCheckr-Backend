/* -- SSL Configuration -- */

export const getSSLConfig = (dialect: string) => {
  // If the dialect is postgres (for both production and Supabase), use the ssl config
  if (dialect === "postgres") {
    // Check if we're connecting to Supabase (contains supabase.co) or production
    const isSupabase =
      process.env.DATABASE_URL?.includes("supabase.co") ||
      process.env.DB_HOST?.includes("supabase.co");
    const isProduction = process.env.NODE_ENV === "production";

    if (isSupabase || isProduction) {
      return {
        require: true,
        rejectUnauthorized: false,
      };
    }
  }

  return false;
};
