import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.js';
import HomePage from './pages/HomePage.js';
import SearchPage from './pages/SearchPage.js';
import ZonesPage from './pages/ZonesPage.js';
import ZoneDetailPage from './pages/ZoneDetailPage.js';
import NpcsPage from './pages/NpcsPage.js';
import NpcDetailPage from './pages/NpcDetailPage.js';
import ItemsPage from './pages/ItemsPage.js';
import ItemDetailPage from './pages/ItemDetailPage.js';
import SpellsPage from './pages/SpellsPage.js';
import SpellDetailPage from './pages/SpellDetailPage.js';
import FactionsPage from './pages/FactionsPage.js';
import FactionDetailPage from './pages/FactionDetailPage.js';
import AasPage from './pages/AasPage.js';
import AaDetailPage from './pages/AaDetailPage.js';
import RecipesPage from './pages/RecipesPage.js';
import RecipeDetailPage from './pages/RecipeDetailPage.js';
import QuestDetailPage from './pages/QuestDetailPage.js';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/zones" element={<ZonesPage />} />
        <Route path="/zones/:id" element={<ZoneDetailPage />} />
        <Route path="/npcs" element={<NpcsPage />} />
        <Route path="/npcs/:id" element={<NpcDetailPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/spells" element={<SpellsPage />} />
        <Route path="/spells/:id" element={<SpellDetailPage />} />
        <Route path="/factions" element={<FactionsPage />} />
        <Route path="/factions/:id" element={<FactionDetailPage />} />
        <Route path="/aas" element={<AasPage />} />
        <Route path="/aas/:id" element={<AaDetailPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/quests/:zone/:npc" element={<QuestDetailPage />} />
      </Routes>
    </Layout>
  );
}
