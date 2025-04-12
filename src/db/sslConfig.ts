/* -- SSL Configuration -- */

export const getSSLConfig = (dialect: string) => {
  // If the environment is production and the dialect is postgres, use the ssl config
  return process.env.NODE_ENV === "production" && dialect === "postgres"
    ? {
        require: true,
        rejectUnauthorized: false,
      }
    : false;
};
