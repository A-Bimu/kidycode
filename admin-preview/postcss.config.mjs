/*
 * The review target loads exactly one stylesheet, app/admin/admin.css, and it is plain CSS with
 * no @tailwind directives. The repository root has a PostCSS config that loads
 * @tailwindcss/postcss for the Cloudflare application; without a config of its own, this app
 * walks up and finds that one, and the build fails on a module the review target does not
 * depend on (the deployment installs only admin-preview's own dependencies).
 *
 * Declaring an empty plugin set here keeps the target self-contained and stops the walk-up.
 */
const config = {
  plugins: {},
};

export default config;