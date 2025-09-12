import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export const TopbarData = (username, userRole) => {
  const userId = localStorage.getItem("userID");

  return [
    {
      title: username || "Account",
      icon: <AccountCircleIcon />,
      subItems: [
        {
          title: "Profile",
          link: "/profile",
        },
        ...(userRole !== 1
          ? [
              {
                title: "Settings",
                link: "/settings",
              },
            ]
          : []),
        {
          title: "Log out",
          link: "/login",
        },
      ],
    },
  ];
};
