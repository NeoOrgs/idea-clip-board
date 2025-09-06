import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Users, Zap, Heart, Eye, Share2, Bookmark, Star, Globe, Shield, Lightbulb } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12
      }
    }
  };

  const floatingVariants: Variants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1] as const
      }
    }
  };

  const featureCards = [
    {
      icon: Heart,
      title: "Curate Collections",
      description: "Organize your visual inspirations into beautiful, shareable boards",
      color: "hsl(var(--primary))"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Connect with creators, discover trending content, and share your vision",
      color: "hsl(var(--accent-foreground))"
    },
    {
      icon: Zap,
      title: "AI Powered",
      description: "Smart recommendations and intelligent search to find exactly what you need",
      color: "hsl(var(--primary))"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Share your creativity with millions of users worldwide",
      color: "hsl(var(--accent-foreground))"
    }
  ];

  const stats = [
    { number: "2M+", label: "Active Users", icon: Users },
    { number: "50M+", label: "Pins Created", icon: Bookmark },
    { number: "1M+", label: "Boards", icon: Star },
    { number: "99.9%", label: "Uptime", icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-4 -left-4 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.01,
            y: mousePosition.y * 0.01,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
        <motion.div
          className="absolute top-1/2 -right-4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -0.015,
            y: mousePosition.y * -0.01,
          }}
          transition={{ type: "spring", stiffness: 30, damping: 20 }}
        />
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10"
          >
            {/* Navigation */}
            <motion.nav
              variants={itemVariants}
              className="glass-card fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full z-50"
            >
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg">Pinspire</span>
                </div>
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <a href="#features" className="story-link hover:text-primary transition-colors">Features</a>
                  <a href="#community" className="story-link hover:text-primary transition-colors">Community</a>
                  <a href="#about" className="story-link hover:text-primary transition-colors">About</a>
                </div>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="btn-modern bg-primary hover:bg-primary-hover text-primary-foreground rounded-full px-6"
                >
                  Get Started
                </Button>
              </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
              <div className="max-w-7xl mx-auto text-center">
                <motion.div variants={itemVariants} className="mb-8">
                  <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm rounded-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Discover, Create, Inspire
                  </Badge>
                  
                  <motion.h1 
                    className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                  >
                    <span className="text-gradient">Visual</span>{" "}
                    <span className="relative">
                      Inspiration
                      <motion.div
                        className="absolute -inset-2 bg-primary/20 rounded-xl -z-10"
                        animate={{ rotate: [0, 1, -1, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      />
                    </span>{" "}
                    <br />
                    <span className="relative">
                      Platform
                      <motion.div
                        className="absolute bottom-0 left-0 w-full h-1 bg-primary"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                      />
                    </span>
                  </motion.h1>
                  
                  <motion.p 
                    className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
                    variants={itemVariants}
                  >
                    Create stunning visual boards, discover incredible content, and connect with a community of creators who share your passion for beautiful design.
                  </motion.p>
                </motion.div>

                <motion.div 
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
                >
                  <Button 
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="btn-modern bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-6 text-lg rounded-full group"
                  >
                    Start Creating
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-6 text-lg rounded-full hover:bg-muted"
                  >
                    Learn More
                  </Button>
                </motion.div>

                {/* Floating demo cards */}
                <motion.div 
                  className="relative max-w-4xl mx-auto"
                  variants={itemVariants}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        variants={floatingVariants}
                        animate="animate"
                        transition={{ delay: i * 0.2 }}
                        className="relative"
                      >
                        <Card className="pin-card aspect-[3/4] p-0 overflow-hidden">
                          <div className={`w-full h-full bg-gradient-to-br ${
                            i === 1 ? 'from-pink-400 to-red-500' :
                            i === 2 ? 'from-blue-400 to-purple-500' :
                            i === 3 ? 'from-green-400 to-teal-500' :
                            'from-yellow-400 to-orange-500'
                          } flex items-center justify-center`}>
                          <div className="text-white text-center">
                            <div className="w-8 h-8 bg-white/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                              {i === 1 ? <Heart className="w-4 h-4" /> :
                               i === 2 ? <Eye className="w-4 h-4" /> :
                               i === 3 ? <Share2 className="w-4 h-4" /> :
                               <Bookmark className="w-4 h-4" />}
                            </div>
                            <p className="text-xs font-medium">Sample Pin {i}</p>
                          </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Stats Section */}
            <motion.section 
              variants={itemVariants}
              className="py-16 px-4"
            >
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 * index, type: "spring", stiffness: 100 }}
                      className="text-center group hover-lift"
                    >
                      <div className="glass-card p-6 rounded-2xl">
                        <stat.icon className="w-8 h-8 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                        <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                          {stat.number}
                        </div>
                        <div className="text-muted-foreground font-medium">{stat.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4">
              <div className="max-w-6xl mx-auto">
                <motion.div 
                  variants={itemVariants}
                  className="text-center mb-16"
                >
                  <Badge variant="secondary" className="mb-4 px-4 py-2">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Features
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    Everything you need to
                    <span className="text-gradient"> create amazing </span>
                    visual stories
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Powerful tools and intuitive design come together to make visual content creation effortless.
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8">
                  {featureCards.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 * index, type: "spring", stiffness: 80 }}
                    >
                      <Card className="glass-card p-8 h-full hover-lift group">
                        <div className="flex items-start gap-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: `${feature.color}15` }}
                          >
                            <feature.icon 
                              className="w-6 h-6" 
                              style={{ color: feature.color }}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <motion.section 
              variants={itemVariants}
              className="py-20 px-4"
            >
              <div className="max-w-4xl mx-auto text-center">
                <Card className="glass-card p-12 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"
                    animate={{ x: [-100, 100] }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                  />
                  <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                      Ready to start your
                      <span className="text-gradient"> visual journey?</span>
                    </h2>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                      Join thousands of creators who are already sharing their inspiration and discovering amazing content.
                    </p>
                    <Button 
                      size="lg"
                      onClick={() => navigate('/auth')}
                      className="btn-modern bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-6 text-lg rounded-full group"
                    >
                      Join Pinspire Today
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </div>
            </motion.section>

            {/* Footer */}
            <motion.footer 
              variants={itemVariants}
              className="py-12 px-4 border-t border-border/50"
            >
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg">Pinspire</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <a href="#" className="story-link hover:text-foreground transition-colors">Privacy</a>
                    <a href="#" className="story-link hover:text-foreground transition-colors">Terms</a>
                    <a href="#" className="story-link hover:text-foreground transition-colors">Support</a>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-border/30 text-center text-sm text-muted-foreground">
                  <p>© 2024 Pinspire. All rights reserved. Made with ❤️ for creators worldwide.</p>
                </div>
              </div>
            </motion.footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;