import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./components/theme-provider";
import { useTheme } from "./components/theme-provider";
import { Switch } from "./components/ui/switch";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { THEMES } from "./data/themes";
import { DIFFICULTIES } from "./data/difficulties";
import { defaultChallenges } from "./data/challenges";
import { 
  PlayCircle, 
  Settings, 
  BookOpen, 
  Users, 
  Trophy, 
  Timer, 
  Sparkles, 
  Target, 
  Crown,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Music,
  Gamepad2,
  Clock,
  Star,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Home,
  RefreshCw,
  LogOut,
  Info,
  HelpCircle,
  Award,
  Zap,
  Brain,
  Heart,
  Smile,
  PartyPopper,
  List,
  Edit,
  Trash2
} from "lucide-react";

export default function SevenSecondChrono() {
  const { theme, setTheme } = useTheme();

  // Écrans : menu, equipes, jeu, fin, tournoi, defis
  const [screen, setScreen] = useState("menu");

  // Gestion des équipes
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('teams');
    if (!saved) return [
      { name: "Équipe A", avatar: "avatars/a.png", score: 0 },
      { name: "Équipe B", avatar: "avatars/b.png", score: 0 },
    ];
    
    // Restaurer les équipes avec leurs avatars par défaut si nécessaire
    const parsedTeams = JSON.parse(saved);
    return parsedTeams.map(team => ({
      ...team,
      avatar: team.avatar || `avatars/${team.name.toLowerCase().replace(/\s+/g, '')}.png`
    }));
  });
  const [teamName, setTeamName] = useState("");
  const [teamAvatar, setTeamAvatar] = useState(null);

  // Gestion des défis
  const [challenges, setChallenges] = useState(() => {
    const saved = localStorage.getItem('challenges');
    return saved ? JSON.parse(saved) : defaultChallenges;
  });
  const [newTheme, setNewTheme] = useState("");
  const [newChallengeText, setNewChallengeText] = useState("");
  const [newAudio, setNewAudio] = useState(null);
  const [newDifficulty, setNewDifficulty] = useState("");

  // État du jeu
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [currentTeam, setCurrentTeam] = useState(0);
  const [remainingTime, setRemainingTime] = useState(7);
  const [timerRunning, setTimerRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameMode, setGameMode] = useState("classic");
  const [selectedTheme, setSelectedTheme] = useState("aléatoire");
  const [selectedDifficulty, setSelectedDifficulty] = useState("aléatoire");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastChallenges, setLastChallenges] = useState([]);
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(3);

  // Ajout d'un état pour le défi en cours d'édition
  const [editingChallenge, setEditingChallenge] = useState(null);

  // Sauvegarde locale
  useEffect(() => {
    localStorage.setItem('challenges', JSON.stringify(challenges));
  }, [challenges]);
  useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
  }, [teams]);

  // Ajout/Suppression d'équipe
  const handleAddTeam = (e) => {
    e.preventDefault();
    if (!teamName) return;
    
    // Utiliser un avatar par défaut si aucun n'est fourni
    const avatarUrl = teamAvatar 
      ? URL.createObjectURL(teamAvatar)
      : `avatars/${teamName.toLowerCase().replace(/\s+/g, '')}.png`;
    
    setTeams(prev => [...prev, { 
      name: teamName, 
      avatar: avatarUrl, 
      score: 0 
    }]);
    
    setTeamName("");
    setTeamAvatar(null);
  };
  const handleRemoveTeam = (idx) => {
    setTeams((prev) => prev.filter((_, i) => i !== idx));
  };

  // Ajout de défi personnalisé
  const handleAddChallenge = (e) => {
    e.preventDefault();
    if (!newTheme || !newChallengeText || !newDifficulty) return;
    
    const newChallenge = {
      text: newChallengeText,
      audio: newAudio ? URL.createObjectURL(newAudio) : null,
      theme: newTheme,
      difficulty: newDifficulty,
      isCustom: true // Marquer comme défi personnalisé
    };
    
    setChallenges(prev => [...prev, newChallenge]);
    setNewChallengeText("");
    setNewTheme("");
    setNewAudio(null);
    setNewDifficulty("");
  };

  // Fonction pour supprimer un défi
  const handleDeleteChallenge = (index) => {
    setChallenges(prev => prev.filter((_, i) => i !== index));
  };

  // Fonction pour modifier un défi
  const handleEditChallenge = (challenge, index) => {
    setEditingChallenge({ ...challenge, index });
    setNewTheme(challenge.theme);
    setNewChallengeText(challenge.text);
    setNewDifficulty(challenge.difficulty);
    setNewAudio(null); // On ne peut pas pré-remplir le fichier audio
  };

  // Fonction pour sauvegarder les modifications d'un défi
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingChallenge || !newTheme || !newChallengeText || !newDifficulty) return;

    setChallenges(prev => prev.map((challenge, index) => 
      index === editingChallenge.index
        ? {
            ...challenge,
            text: newChallengeText,
            theme: newTheme,
            difficulty: newDifficulty,
            audio: newAudio ? URL.createObjectURL(newAudio) : challenge.audio
          }
        : challenge
    ));

    // Réinitialiser le formulaire
    setEditingChallenge(null);
    setNewTheme("");
    setNewChallengeText("");
    setNewDifficulty("");
    setNewAudio(null);
  };

  // --- LOGIQUE DE JEU ---
  // Barème standard : facile = 1pt, moyen = 2pts, difficile = 3pts, +1pt si temps restant > 3s
  const getPoints = (difficulty, remaining) => {
    let base = 1;
    if (difficulty === "moyen") base = 2;
    if (difficulty === "difficile") base = 3;
    if (remaining > 3) base += 1;
    return base;
  };

  // Modification de la fonction pickChallenge pour un filtrage plus strict
  const pickChallenge = () => {
    // Filtrer les défis disponibles selon le mode de jeu
    let availableChallenges = [...defaultChallenges, ...challenges.filter(c => c.isCustom)];
    
    if (gameMode === "classic") {
      // En mode classique, on filtre selon les sélections si elles ne sont pas "aléatoire"
      availableChallenges = availableChallenges.filter(challenge => {
        const themeMatch = selectedTheme === "aléatoire" || challenge.theme === selectedTheme;
        const difficultyMatch = selectedDifficulty === "aléatoire" || challenge.difficulty === selectedDifficulty;
        return themeMatch && difficultyMatch;
      });
    } else if (gameMode === "expert") {
      // En mode expert, on force le respect strict des conditions
      if (selectedTheme === "aléatoire" || selectedDifficulty === "aléatoire") {
        // Si un des critères est aléatoire, on revient au mode classique
        setGameMode("classic");
        return pickChallenge();
      }
      
      // Filtrage strict des défis selon les critères choisis
      availableChallenges = availableChallenges.filter(challenge => 
        challenge.theme === selectedTheme && 
        challenge.difficulty === selectedDifficulty
      );
    } else if (gameMode === "creative") {
      // En mode créatif, on ne garde que les défis personnalisés
      availableChallenges = availableChallenges.filter(challenge => challenge.isCustom);
    }

    // Éviter les répétitions récentes
    availableChallenges = availableChallenges.filter(
      challenge => !lastChallenges.includes(challenge.text)
    );

    // Si aucun défi n'est disponible, réinitialiser l'historique
    if (availableChallenges.length === 0) {
      setLastChallenges([]);
      // Réessayer avec l'historique réinitialisé
      if (gameMode === "expert") {
        availableChallenges = [...defaultChallenges, ...challenges.filter(c => c.isCustom)]
          .filter(challenge => 
            challenge.theme === selectedTheme && 
            challenge.difficulty === selectedDifficulty
          );
      } else {
        availableChallenges = [...defaultChallenges, ...challenges.filter(c => c.isCustom)];
      }
    }

    // Si toujours aucun défi disponible, retourner au mode classique
    if (availableChallenges.length === 0) {
      setGameMode("classic");
      setSelectedTheme("aléatoire");
      setSelectedDifficulty("aléatoire");
      return pickChallenge();
    }

    // Sélectionner un défi aléatoire
    const randomIndex = Math.floor(Math.random() * availableChallenges.length);
    const selectedChallenge = availableChallenges[randomIndex];

    // Mettre à jour l'historique
    setLastChallenges(prev => {
      const newHistory = [...prev, selectedChallenge.text];
      return newHistory.slice(-5); // Garder les 5 derniers défis
    });

    return selectedChallenge;
  };

  // Fonction de réinitialisation complète du jeu
  const resetGame = () => {
    setCurrentTeam(0);
    setCurrentChallenge(null);
    setRemainingTime(7);
    setTimerRunning(false);
    setGameOver(false);
    setRound(1);
    setLastChallenges([]);
    // Réinitialiser les scores tout en préservant les avatars
    setTeams(teams.map(t => ({ 
      ...t, 
      score: 0,
      avatar: t.avatar || `avatars/${t.name.toLowerCase().replace(/\s+/g, '')}.png`
    })));
  };

  // Modification de la fonction nextTeam
  const nextTeam = () => {
    if (currentTeam + 1 < teams.length) {
      setCurrentTeam(currentTeam + 1);
      setCurrentChallenge(null);
      setRemainingTime(7);
      setTimerRunning(false);
    } else {
      // Fin de manche
      if (round < maxRounds) {
        setRound(round + 1);
        setCurrentTeam(0);
        setCurrentChallenge(null);
        setRemainingTime(7);
        setTimerRunning(false);
      } else {
        setGameOver(true);
        setScreen("fin");
      }
    }
  };

  // Modification de la fonction startChallenge
  const startChallenge = () => {
    if (timerRunning) return; // Ne rien faire si un défi est en cours
    
    const challenge = pickChallenge();
    if (!challenge) return;
    
    setCurrentChallenge(challenge);
    setRemainingTime(7);
    setTimerRunning(true);
    
    if (challenge.audio && soundEnabled) {
      const audio = new Audio(challenge.audio);
      audio.play().catch(error => console.error("Erreur lors de la lecture audio:", error));
    }
  };

  // Timer
  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => {
        setRemainingTime((time) => {
          if (time <= 0.1) {
            clearInterval(interval);
            setTimerRunning(false);
            return 0;
          }
          return parseFloat((time - 0.1).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Succès/Échec d'un défi
  const handleSuccess = () => {
    setTeams(prev => prev.map((t, idx) => idx === currentTeam
      ? { ...t, score: t.score + getPoints(currentChallenge.difficulty, remainingTime) }
      : t
    ));
    nextTeam();
  };
  const handleFail = () => {
    nextTeam();
  };

  // Menu démarrer
  if (screen === "menu") {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Effet de particules en arrière-plan */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-emerald-500/20 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: [null, Math.random() * window.innerHeight],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>

          <motion.div 
            className="w-full max-w-2xl mx-auto text-center space-y-8 relative z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo et Titre */}
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200
                }}
                className="w-40 h-40 mx-auto mb-4 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-full blur-2xl opacity-50 animate-pulse" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 transform hover:scale-105 transition-transform duration-300">
                    <Timer className="w-20 h-20 text-white" />
                  </div>
                </div>
              </motion.div>
              <motion.h1 
                className="text-7xl font-black tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="gradient-text">
                  7 Secondes
                </span>
                <br />
                <span className="gradient-text">
                  Chrono
                </span>
              </motion.h1>
              <motion.p 
                className="text-2xl text-emerald-600/80 dark:text-emerald-400/80 font-light tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Le jeu de mime le plus rapide du monde !
              </motion.p>
            </div>

            {/* Boutons du menu */}
            <motion.div 
              className="flex flex-col gap-4 max-w-sm mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button 
                size="lg" 
                className="btn-gradient h-16 text-xl font-semibold group"
                onClick={() => setScreen("equipes")}
              >
                <PlayCircle className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
                Démarrer la partie
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="btn-outline h-16 text-xl font-semibold group"
                onClick={() => setScreen("options")}
              >
                <Settings className="w-6 h-6 mr-2 group-hover:rotate-90 transition-transform" />
                Options
              </Button>
              
              <Button 
                variant="ghost" 
                size="lg"
                className="btn-ghost h-16 text-xl font-semibold group"
                onClick={() => setScreen("defis")}
              >
                <List className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
                Gérer les défis
              </Button>
            </motion.div>

            {/* Switch thème */}
            <motion.div 
              className="absolute top-4 right-4 flex items-center gap-2 bg-emerald-950/50 backdrop-blur-sm p-3 rounded-full shadow-lg border border-emerald-500/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Label htmlFor="theme-switch" className="text-lg">
                {theme === "dark" ? "🌙" : "☀️"}
              </Label>
              <Switch
                id="theme-switch"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-teal-500"
              />
            </motion.div>

            {/* Version et crédits */}
            <motion.div
              className="absolute bottom-4 left-4 text-sm text-emerald-600/60 dark:text-emerald-400/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              v1.0.0 • Créé avec <span className="text-emerald-500">❤️</span>
            </motion.div>
          </motion.div>
        </div>
      </ThemeProvider>
    );
  }

  // Gestion des équipes avant de jouer
  if (screen === "equipes") {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="card-hover">
              <CardContent className="p-8">
                {/* En-tête */}
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold gradient-text mb-2">
                    Équipes
                  </h2>
                  <p className="text-muted-foreground">
                    Ajoutez ou supprimez des équipes pour commencer la partie
                  </p>
                </div>

                {/* Liste des équipes */}
                <motion.div 
                  className="space-y-4 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {teams.map((team, idx) => (
                    <motion.div
                      key={team.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="ranking-item"
                    >
                      <div className="relative">
                        <img 
                          src={team.avatar} 
                          className="avatar-border w-16 h-16" 
                          alt={`Avatar de ${team.name}`}
                        />
                        <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">Score: {team.score} points</p>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                        onClick={() => handleRemoveTeam(idx)}
                      >
                        Supprimer
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Formulaire d'ajout d'équipe */}
                <motion.form 
                  onSubmit={handleAddTeam} 
                  className="card-hover p-6 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-xl font-semibold mb-4">➕ Ajouter une équipe</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="team-name" className="text-sm font-medium mb-2 block">
                        Nom de l'équipe
                      </Label>
                      <Input 
                        id="team-name"
                        type="text" 
                        placeholder="Entrez le nom de l'équipe" 
                        value={teamName} 
                        onChange={e => setTeamName(e.target.value)}
                        className="input-modern"
                      />
                    </div>
                    <div>
                      <Label htmlFor="team-avatar" className="text-sm font-medium mb-2 block">
                        Avatar de l'équipe
                      </Label>
                      <Input 
                        id="team-avatar"
                        type="file" 
                        accept="image/*" 
                        onChange={e => setTeamAvatar(e.target.files[0])}
                        className="input-modern file:bg-emerald-500/10 file:text-emerald-500 file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4 file:hover:bg-emerald-500/20"
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="btn-gradient w-full"
                    >
                      Ajouter l'équipe
                    </Button>
                  </div>
                </motion.form>

                {/* Boutons de navigation */}
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setScreen("menu")}
                    className="btn-outline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour au menu
                  </Button>
                  <Button 
                    onClick={() => { 
                      // Réinitialiser le jeu avant de changer d'écran
                      setCurrentTeam(0);
                      setCurrentChallenge(null);
                      setRemainingTime(7);
                      setTimerRunning(false);
                      setGameOver(false);
                      setRound(1);
                      setLastChallenges([]);
                      setTeams(teams.map(t => ({ 
                        ...t, 
                        score: 0,
                        avatar: t.avatar || `avatars/${t.name.toLowerCase().replace(/\s+/g, '')}.png`
                      })));
                      // Changer d'écran après la réinitialisation
                      setScreen("jeu");
                    }}
                    className="btn-gradient"
                    disabled={teams.length < 2}
                  >
                    Lancer la partie
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {teams.length < 2 && (
                  <p className="text-center text-sm text-red-500 mt-4">
                    ⚠️ Ajoutez au moins 2 équipes pour commencer
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </ThemeProvider>
    );
  }

  // --- ÉCRAN DE JEU ---
  if (screen === "jeu") {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Barre de navigation */}
            <div className="flex justify-between items-center mb-8">
              <Button 
                variant="outline" 
                onClick={() => setScreen("menu")}
                className="btn-outline"
              >
                <Home className="w-4 h-4 mr-2" />
                Menu
              </Button>
              <motion.div 
                className="text-center"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-2xl font-bold gradient-text">
                  Manche {round} / {maxRounds}
                </span>
              </motion.div>
              <Button 
                variant="outline" 
                onClick={() => setScreen("fin")}
                className="btn-outline text-red-500 hover:text-red-500 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Quitter
              </Button>
            </div>

            {/* Équipe active */}
            <motion.div 
              className="card-hover p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-6">
                <div className="relative">
                  <motion.img 
                    src={teams[currentTeam].avatar} 
                    className="avatar-border w-24 h-24" 
                    alt={`Avatar de ${teams[currentTeam].name}`}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div 
                    className="absolute -top-2 -right-2 bg-emerald-500 text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {currentTeam + 1}
                  </motion.div>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{teams[currentTeam].name}</h2>
                  <p className="text-xl text-muted-foreground">
                    Score actuel : <span className="text-emerald-500 font-bold">{teams[currentTeam].score}</span> points
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Filtres et contrôles */}
            <motion.div 
              className="grid grid-cols-2 gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {gameMode === "expert" && (
                <>
                  <Select 
                    value={selectedTheme} 
                    onValueChange={(value) => {
                      setSelectedTheme(value);
                      // Si on sélectionne "aléatoire", passer en mode classique
                      if (value === "aléatoire") {
                        setGameMode("classic");
                      }
                    }}
                  >
                    <SelectTrigger className="select-modern">
                      <SelectValue placeholder="Choisir un thème" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aléatoire" className="hover:bg-emerald-500/10">
                        Aléatoire
                      </SelectItem>
                      {THEMES.map(theme => (
                        <SelectItem key={theme} value={theme} className="hover:bg-emerald-500/10">
                          {theme}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={selectedDifficulty} 
                    onValueChange={(value) => {
                      setSelectedDifficulty(value);
                      // Si on sélectionne "aléatoire", passer en mode classique
                      if (value === "aléatoire") {
                        setGameMode("classic");
                      }
                    }}
                  >
                    <SelectTrigger className="select-modern">
                      <SelectValue placeholder="Choisir une difficulté" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aléatoire" className="hover:bg-emerald-500/10">
                        Aléatoire
                      </SelectItem>
                      {DIFFICULTIES.map(diff => (
                        <SelectItem key={diff.id} value={diff.id} className="hover:bg-emerald-500/10">
                          {diff.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              {gameMode !== "expert" && (
                <div className="col-span-2 text-center text-muted-foreground">
                  {gameMode === "creative" ? "Mode Créatif : utilisez vos défis personnalisés" : "Mode Classique : défis aléatoires"}
                </div>
              )}
            </motion.div>

            {/* Zone de défi */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                onClick={startChallenge} 
                disabled={timerRunning}
                className="btn-gradient w-full h-16 text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {timerRunning ? "Défi en cours..." : "Générer un défi"}
              </Button>
            </motion.div>

            {/* Affichage du défi */}
            <AnimatePresence mode="wait">
              {currentChallenge && (
                <motion.div 
                  className="mb-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="challenge-card">
                    <motion.p 
                      className="text-3xl font-bold text-center mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {currentChallenge.text}
                    </motion.p>
                    <div className="flex justify-center items-center gap-4 text-muted-foreground">
                      <span className="badge">
                        {currentChallenge.theme}
                      </span>
                      <span className="badge">
                        {currentChallenge.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Timer */}
                  <motion.div 
                    className="mt-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.span 
                      className={`text-6xl font-bold ${remainingTime <= 3 ? 'timer-warning' : 'text-emerald-500'}`}
                      animate={{ scale: remainingTime <= 3 ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 0.5, repeat: remainingTime <= 3 ? Infinity : 0 }}
                    >
                      {remainingTime.toFixed(1)}s
                    </motion.span>
                  </motion.div>

                  {/* Boutons de validation */}
                  {!timerRunning && (
                    <motion.div 
                      className="flex gap-4 mt-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button 
                        onClick={handleSuccess}
                        className="flex-1 h-14 text-lg font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Défi réussi
                      </Button>
                      <Button 
                        onClick={handleFail}
                        className="flex-1 h-14 text-lg font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Échec
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tableau des scores */}
            <motion.div 
              className="mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-bold mb-4 text-center gradient-text">Scores actuels</h3>
              <div className="grid grid-cols-2 gap-4">
                {teams.map((team, idx) => (
                  <motion.div
                    key={team.name}
                    className={`ranking-item ${
                      idx === currentTeam 
                        ? 'border-emerald-500 bg-emerald-500/10' 
                        : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={team.avatar} 
                        className="avatar-border w-10 h-10" 
                        alt={`Avatar de ${team.name}`}
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{team.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {team.score} points
                        </p>
                      </div>
                      {idx === currentTeam && (
                        <span className="text-emerald-500">→</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Section pour gérer les défis personnalisés */}
            {gameMode === "creative" && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="card-hover p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                    <span className="gradient-text">Défis personnalisés</span>
                  </h3>
                  
                  {/* Formulaire d'ajout */}
                  <form onSubmit={handleAddChallenge} className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="block mb-2">Thème</Label>
                        <Input
                          type="text"
                          value={newTheme}
                          onChange={e => setNewTheme(e.target.value)}
                          placeholder="Nouveau thème"
                          className="input-modern"
                        />
                      </div>
                      <div>
                        <Label className="block mb-2">Difficulté</Label>
                        <Select value={newDifficulty} onValueChange={setNewDifficulty}>
                          <SelectTrigger className="select-modern">
                            <SelectValue placeholder="Choisir une difficulté" />
                          </SelectTrigger>
                          <SelectContent>
                            {DIFFICULTIES.map(diff => (
                              <SelectItem key={diff.id} value={diff.id}>
                                {diff.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="block mb-2">Description du défi</Label>
                      <Input
                        type="text"
                        value={newChallengeText}
                        onChange={e => setNewChallengeText(e.target.value)}
                        placeholder="Décrivez le défi à réaliser"
                        className="input-modern"
                      />
                    </div>
                    
                    <div>
                      <Label className="block mb-2">Son (optionnel)</Label>
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={e => setNewAudio(e.target.files[0])}
                        className="input-modern file:bg-emerald-500/10 file:text-emerald-500"
                      />
                    </div>
                    
                    <Button type="submit" className="btn-gradient w-full">
                      Ajouter le défi
                    </Button>
                  </form>
                  
                  {/* Liste des défis personnalisés */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-muted-foreground">Vos défis ({challenges.filter(c => c.isCustom).length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {challenges.filter(c => c.isCustom).map((challenge, index) => (
                        <div key={index} className="card-hover p-4">
                          <p className="font-medium mb-2">{challenge.text}</p>
                          <div className="flex gap-2">
                            <span className="badge">{challenge.theme}</span>
                            <span className="badge">{challenge.difficulty}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </ThemeProvider>
    );
  }

  // --- ÉCRAN DE FIN ---
  if (screen === "fin") {
    const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
    const winner = sortedTeams[0];
    const isDraw = sortedTeams.length > 1 && sortedTeams[0].score === sortedTeams[1].score;

    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="card-hover overflow-hidden">
              <CardContent className="p-8">
                {/* En-tête avec trophée */}
                <motion.div 
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="w-32 h-32 mx-auto mb-4 relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.2
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-full blur-xl opacity-50" />
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Trophy className="w-20 h-20 text-emerald-500" />
                    </div>
                  </motion.div>
                  <h2 className="text-4xl font-bold gradient-text mb-2">
                    {isDraw ? "Match nul !" : "Fin de partie !"}
                  </h2>
                  {!isDraw && (
                    <motion.p 
                      className="text-xl text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {winner.name} remporte la victoire !
                    </motion.p>
                  )}
                </motion.div>

                {/* Classement */}
                <motion.div 
                  className="space-y-4 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {sortedTeams.map((team, index) => (
                    <motion.div
                      key={team.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className={`ranking-item ${
                        index === 0 
                          ? 'border-emerald-500 bg-emerald-500/10' 
                          : ''
                      }`}
                    >
                      {/* Position */}
                      <div className="absolute -left-3 -top-3 w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xl shadow-lg">
                        #{index + 1}
                      </div>

                      <div className="flex items-center gap-6 pl-6">
                        {/* Avatar */}
                        <div className="relative">
                          <motion.img 
                            src={team.avatar} 
                            className={`avatar-border w-20 h-20 ${
                              index === 0 
                                ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' 
                                : ''
                            }`}
                            alt={`Avatar de ${team.name}`}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1 + index * 0.1 }}
                          />
                          {index === 0 && (
                            <motion.div
                              className="absolute -top-2 -right-2"
                              initial={{ scale: 0, rotate: -20 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ 
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                delay: 1.2
                              }}
                            >
                              <Crown className="w-8 h-8 text-emerald-500" />
                            </motion.div>
                          )}
                        </div>

                        {/* Informations de l'équipe */}
                        <div className="flex-1">
                          <h3 className={`text-2xl font-bold ${
                            index === 0 ? 'text-emerald-500' : ''
                          }`}>
                            {team.name}
                          </h3>
                          <p className="text-lg text-muted-foreground">
                            {team.score} points
                          </p>
                        </div>

                        {/* Badge de position */}
                        {index === 0 && (
                          <motion.div
                            className="badge bg-emerald-500 text-white font-bold"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.4 }}
                          >
                            Vainqueur
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Boutons d'action */}
                <motion.div 
                  className="flex justify-between gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <Button 
                    variant="outline" 
                    onClick={() => setScreen("menu")}
                    className="btn-outline flex-1 h-14 text-lg font-semibold"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    Menu principal
                  </Button>
                  <Button 
                    onClick={() => {
                      resetGame();
                      setScreen("jeu");
                    }}
                    className="btn-gradient flex-1 h-14 text-lg font-semibold"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Nouvelle partie
                  </Button>
                </motion.div>

                {/* Message de félicitations */}
                {!isDraw && (
                  <motion.p 
                    className="text-center text-muted-foreground mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                  >
                    Félicitations à {winner.name} pour cette victoire ! 🎉
                  </motion.p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </ThemeProvider>
    );
  }

  // --- ÉCRAN OPTIONS ---
  if (screen === "options") {
    const gameModes = [
      {
        id: "classic",
        name: "Classique",
        description: "Mode standard avec défis aléatoires de toutes difficultés",
        icon: <Gamepad2 className="w-8 h-8" />,
        color: "from-emerald-500 to-emerald-600"
      },
      {
        id: "expert",
        name: "Expert",
        description: "Défis sur un thème spécifique pour plus de challenge",
        icon: <Target className="w-8 h-8" />,
        color: "from-teal-500 to-teal-600"
      },
      {
        id: "creative",
        name: "Créatif",
        description: "Créez et jouez avec vos propres défis personnalisés",
        icon: <Sparkles className="w-8 h-8" />,
        color: "from-emerald-400 to-emerald-500"
      }
    ];

    const currentMode = gameModes.find(mode => 
      (mode.id === "classic" && !gameMode.includes("tournament") && !gameMode.includes("expert") && !gameMode.includes("creative"))
    );

    const handleModeChange = (mode) => {
      setGameMode(mode);
      setSelectedTheme("aléatoire");
      setSelectedDifficulty("aléatoire");
    };

    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="card-hover">
              <CardContent className="p-8">
                {/* En-tête */}
                <motion.div 
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-4xl font-bold gradient-text mb-2">
                    Options de jeu
                  </h2>
                  <p className="text-muted-foreground">
                    Personnalisez votre expérience de jeu
                  </p>
                </motion.div>

                {/* Sélection du mode de jeu */}
                <motion.div 
                  className="mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label className="text-lg font-semibold mb-4 block">
                    Mode de jeu
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gameModes.map((mode) => (
                      <motion.button
                        key={mode.id}
                        onClick={() => handleModeChange(mode.id)}
                        className={`card-hover p-6 ${
                          gameMode === mode.id
                            ? `bg-gradient-to-r ${mode.color} bg-opacity-20 border-emerald-500`
                            : ''
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`text-emerald-500 ${gameMode === mode.id ? 'animate-bounce' : ''}`}>
                            {mode.icon}
                          </div>
                          <div className="text-left">
                            <h3 className={`text-xl font-bold mb-1 ${
                              gameMode === mode.id ? 'text-emerald-500' : ''
                            }`}>
                              {mode.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {mode.description}
                            </p>
                          </div>
                        </div>
                        {gameMode === mode.id && (
                          <motion.div
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Options de la partie classique */}
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8 overflow-hidden"
                >
                  <div className="card-hover p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Clock className="w-8 h-8 text-emerald-500" />
                      <h3 className="text-xl font-semibold">Configuration de la partie</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="block mb-2">
                          Nombre de manches
                        </Label>
                        <div className="flex items-center gap-4">
                          <Input 
                            type="number" 
                            min={1} 
                            max={20} 
                            value={maxRounds} 
                            onChange={e => setMaxRounds(Number(e.target.value))}
                            className="input-modern w-32"
                          />
                          <span className="text-sm text-muted-foreground">
                            {maxRounds === 1 ? "manche" : "manches"}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Le score total sera cumulé sur toutes les manches pour déterminer le vainqueur.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Boutons de navigation */}
                <motion.div 
                  className="flex justify-between gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button 
                    variant="outline" 
                    onClick={() => setScreen("menu")}
                    className="btn-outline flex-1 h-14 text-lg font-semibold"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Retour au menu
                  </Button>
                  <Button 
                    onClick={() => setScreen("equipes")}
                    className="btn-gradient flex-1 h-14 text-lg font-semibold"
                  >
                    Valider
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </ThemeProvider>
    );
  }

  // --- ÉCRAN RÈGLES ---
  if (screen === "regles") {
    const rules = [
      {
        title: "Déroulement du jeu",
        icon: <Gamepad2 className="w-6 h-6" />,
        items: [
          "Les équipes jouent à tour de rôle",
          "Chaque équipe a 7 secondes pour réaliser son défi",
          "Un défi est généré aléatoirement selon le mode choisi",
          "L'équipe doit mimer ou réaliser le défi sans parler"
        ]
      },
      {
        title: "Système de points",
        icon: <Star className="w-6 h-6" />,
        items: [
          "Défi facile : 1 point",
          "Défi moyen : 2 points",
          "Défi difficile : 3 points",
          "Bonus de rapidité : +1 point si le défi est réussi en moins de 4 secondes"
        ]
      },
      {
        title: "Modes de jeu",
        icon: <Target className="w-6 h-6" />,
        items: [
          "Classique : défis aléatoires de toutes difficultés",
          "Expert : défis sur un thème spécifique",
          "Créatif : utilisez vos propres défis personnalisés",
          "Tournoi : plusieurs manches pour un champion"
        ]
      },
      {
        title: "Conseils",
        icon: <Lightbulb className="w-6 h-6" />,
        items: [
          "Communiquez efficacement avec votre équipe",
          "Restez créatif dans vos mimes",
          "Gérez bien votre temps",
          "Amusez-vous !"
        ]
      }
    ];

    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="card-hover">
              <CardContent className="p-8">
                {/* En-tête */}
                <motion.div 
                  className="text-center mb-12"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="w-24 h-24 mx-auto mb-4 relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.2
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-full blur-xl opacity-50" />
                    <div className="relative w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-emerald-500" />
                    </div>
                  </motion.div>
                  <h2 className="text-4xl font-bold gradient-text mb-2">
                    Règles du jeu
                  </h2>
                  <p className="text-muted-foreground">
                    Tout ce que vous devez savoir pour jouer
                  </p>
                </motion.div>

                {/* Sections des règles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rules.map((section, index) => (
                    <motion.div
                      key={section.title}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="card-hover p-6"
                    >
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="text-emerald-500">{section.icon}</span>
                        <span className="gradient-text">
                          {section.title}
                        </span>
                      </h3>
                      <ul className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                          <motion.li
                            key={item}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + (index * 0.1) + (itemIndex * 0.1) }}
                            className="flex items-start gap-3"
                          >
                            <span className="text-emerald-500 mt-1">•</span>
                            <span className="text-muted-foreground">{item}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>

                {/* Exemple de défi */}
                <motion.div
                  className="card-hover mt-8 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-emerald-500">
                      <Zap className="w-6 h-6" />
                    </span>
                    <span className="gradient-text">
                      Exemple de défi
                    </span>
                  </h3>
                  <div className="challenge-card">
                    <p className="text-lg font-semibold mb-2">
                      "Imitez un dauphin heureux qui fait des sauts périlleux"
                    </p>
                    <div className="flex gap-2">
                      <span className="badge">
                        Thème : animaux
                      </span>
                      <span className="badge">
                        Difficulté : moyen
                      </span>
                      <span className="badge">
                        Points : 2 (+1 si rapide)
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Bouton de retour */}
                <motion.div 
                  className="mt-8 flex justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <Button 
                    onClick={() => setScreen("menu")}
                    className="btn-gradient h-14 px-8 text-lg font-semibold"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    Retour au menu
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </ThemeProvider>
    );
  }

  // --- ÉCRAN DE GESTION DES DÉFIS ---
  if (screen === "defis") {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="card-hover">
              <CardContent className="p-8">
                {/* En-tête */}
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-bold gradient-text mb-2">
                    Gestion des défis
                  </h2>
                  <p className="text-muted-foreground">
                    Gérez vos défis personnalisés
                  </p>
                </div>

                {/* Formulaire d'ajout/modification */}
                <motion.div 
                  className="card-hover p-6 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                    {editingChallenge ? "Modifier le défi" : "Ajouter un défi"}
                  </h3>
                  
                  <form onSubmit={editingChallenge ? handleSaveEdit : handleAddChallenge} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="block mb-2">Thème</Label>
                        <Input
                          type="text"
                          value={newTheme}
                          onChange={e => setNewTheme(e.target.value)}
                          placeholder="Nouveau thème"
                          className="input-modern"
                        />
                      </div>
                      <div>
                        <Label className="block mb-2">Difficulté</Label>
                        <Select value={newDifficulty} onValueChange={setNewDifficulty}>
                          <SelectTrigger className="select-modern">
                            <SelectValue placeholder="Choisir une difficulté" />
                          </SelectTrigger>
                          <SelectContent>
                            {DIFFICULTIES.map(diff => (
                              <SelectItem key={diff.id} value={diff.id}>
                                {diff.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="block mb-2">Description du défi</Label>
                      <Input
                        type="text"
                        value={newChallengeText}
                        onChange={e => setNewChallengeText(e.target.value)}
                        placeholder="Décrivez le défi à réaliser"
                        className="input-modern"
                      />
                    </div>
                    
                    <div>
                      <Label className="block mb-2">Son (optionnel)</Label>
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={e => setNewAudio(e.target.files[0])}
                        className="input-modern file:bg-emerald-500/10 file:text-emerald-500"
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <Button 
                        type="submit" 
                        className="btn-gradient flex-1"
                      >
                        {editingChallenge ? "Enregistrer" : "Ajouter"}
                      </Button>
                      {editingChallenge && (
                        <Button 
                          type="button"
                          variant="outline"
                          className="btn-outline flex-1"
                          onClick={() => {
                            setEditingChallenge(null);
                            setNewTheme("");
                            setNewChallengeText("");
                            setNewDifficulty("");
                            setNewAudio(null);
                          }}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </form>
                </motion.div>

                {/* Liste des défis personnalisés */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <List className="w-6 h-6 text-emerald-500" />
                    Vos défis ({challenges.filter(c => c.isCustom).length})
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {challenges.filter(c => c.isCustom).map((challenge, index) => (
                      <div key={index} className="card-hover p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium mb-2">{challenge.text}</p>
                            <div className="flex gap-2">
                              <span className="badge">{challenge.theme}</span>
                              <span className="badge">{challenge.difficulty}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="btn-outline"
                              onClick={() => handleEditChallenge(challenge, index)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                              onClick={() => handleDeleteChallenge(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Boutons de navigation */}
                <motion.div 
                  className="flex justify-between gap-4 mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button 
                    variant="outline" 
                    onClick={() => setScreen("menu")}
                    className="btn-outline flex-1 h-14 text-lg font-semibold"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Retour au menu
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </ThemeProvider>
    );
  }

  return null;
}
