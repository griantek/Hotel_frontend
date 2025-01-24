export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Xcelinfotech",
  description: "The perfect page for your booking",
  navItems: [
    {
      label: "Offers",
      href: "/offers",
    },
  ],
  navMenuItems: [
    
    {
      label: "Offers",
      href: "/offers",
    },
  ],
  adminNavItems: [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
    },
    {
      label: "Bookings",
      href: "/admin/bookings",
    },
    {
      label: "Rooms",
      href: "/admin/rooms",
    },
    {
      label: "Users",
      href: "/admin/users",
    },
    {
      label: "Feedback",
      href: "/admin/feedbacks",
    },
  ],
  links: {
    github: "https://github.com/nextui-org/nextui",
    twitter: "https://twitter.com/getnextui",
    docs: "https://nextui.org",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
