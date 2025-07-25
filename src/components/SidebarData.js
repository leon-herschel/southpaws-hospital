import React from 'react';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import SortIcon from '@mui/icons-material/Sort';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PetsIcon from '@mui/icons-material/Pets';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HistoryIcon from '@mui/icons-material/History';
import ArchiveIcon from '@mui/icons-material/Archive';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LabelIcon from '@mui/icons-material/Label'; // For Brand
import ScaleIcon from '@mui/icons-material/Scale'; // For Unit of Measurement
import AssignmentIcon from '@mui/icons-material/Assignment'; // For general forms
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'; // To differentiate types of forms
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';



export const SidebarData = [
    {
        title: "Dashboard",
        icon: <HomeIcon />,
        link: "/home"
    },
    {
        title: "Products",
        icon: <VaccinesIcon />,
        subItems: [
            {
                title: "Product List",
                icon: <ListAltIcon />,
                link: "/products"
            },
            {
                title: "Generic",
                icon: <SortIcon />,
                link: "/generic"
            },
            {
                title: "Category",
                icon: <SortIcon />,
                link: "/category"
            },
            {
                title: "Inventory",
                icon: <InventoryIcon />,
                link: "/inventory"
            },
            {
                title: "Brand",
                icon: <LabelIcon />,
                link: "/brand"
            },
            {
                title: "Unit Of Measurement",
                icon: <ScaleIcon />,
                link: "/unitofmeasurement"
            },
        ]
    },
    {
        title: "Suppliers",
        icon: <LocalShippingIcon />,
        link: "/suppliers"
    },
    {
        title: "Services",
        icon: <MedicalServicesIcon />,
        subItems: [
            {
                title: "Services",
                icon: <LocalHospitalIcon  />,
                link: "/services"
            },
            {
                title: "Immunization Form",
                icon: <AssignmentIcon />,
                link: "/ImmunizationForm"
            },
            {
                title: "Surgical Form",
                icon: <AssignmentIndIcon />,
                link: "/SurgicalForm"
            },
        ]
    },
    {
        title: "Sales",
        icon: <ShowChartIcon />,
        subItems: [
            {
                title: "Point of Sales",
                icon: <PointOfSaleIcon />,
                link: "/pointofsales"
            },
            {
                title: "Sales List",
                icon: <ReceiptLongIcon />,
                link: "/Sales"
            },
            {
                title: "Forecasting",
                icon: <TrendingUpIcon />,
                link: "/forecasting"
            },
        ]
    },
    {
        title: "Client Information",
        icon: <PetsIcon />,
        link: "/information/clients"
    },
    {
        title: "User Management",
        icon: <PersonAddIcon />,
        link: "/usermanagement"
    },
    {
        title: "Log History",
        icon: <HistoryIcon />,
        link: "/history"
    },
    {
        title: "Archive",
        icon: <ArchiveIcon />,
        link: "/archive"
    },
    {
        title: "Report Generation",
        icon: <AssignmentIcon />,
        link: "/report-generation"
    },

];
