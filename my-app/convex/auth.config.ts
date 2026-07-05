// Clerk issuer domain comes from the Clerk dashboard's "convex" JWT template.
// Guarded so the deployment still works before the template is configured.
export default {
  providers: process.env.CLERK_JWT_ISSUER_DOMAIN
    ? [
        {
          domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
          applicationID: "convex",
        },
      ]
    : [],
};
