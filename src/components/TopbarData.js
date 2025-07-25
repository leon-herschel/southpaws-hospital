import React, { useState } from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export const TopbarData = (username) => [
  {
    title: username || "Account",
    icon: <AccountCircleIcon />,
    subItems: [
      {
        title: "Profile",
        link: "/profile"
      },
      {
        title: "Log out",
        link: "/login"
      },
    ]
  }
];
