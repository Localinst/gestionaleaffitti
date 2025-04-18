import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Pagine autenticate
import DashboardPage from "@/components/dashboard/DashboardPage";
import PropertiesPage from "@/components/properties/PropertiesPage";
import PropertyDetail from "@/components/properties/PropertyDetail";
import TenantsPage from "@/components/tenants/TenantsPage";
import TenantDetail from "@/components/tenants/TenantDetail";
import TransactionsPage from "@/components/transactions/TransactionsPage";
import ContractsPage from "@/components/contracts/ContractsPage";
import ContractDetail from "@/components/contracts/ContractDetail";
import ActivitiesPage from "@/components/activities/ActivitiesPage";
import ReportsPage from "@/components/reports/ReportsPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFoundPage from "@/pages/NotFoundPage";
import LandingPage from "@/pages/LandingPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ImportPage from "@/pages/ImportPage";
import InfoPage from "@/pages/InfoPage";

// Pagine pubbliche
import BlogPage from "@/pages/Blog";
import BlogDetail from "@/pages/BlogDetail";
import GuidePage from "@/pages/GuidePage";
import GuideDetail from "@/pages/GuideDetail";
import SupportoPage from "@/pages/Supporto";
import { PrivacyPolicy, TerminiServizio, CookiePolicy } from "@/pages/Legali";
import Pricing from "@/pages/Pricing";

// ... existing code ... 