import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, Plus, MessageSquare, Bot, User, Loader2, ShoppingBag, Monitor, Sparkles, Home, Coffee, Activity, Dog, Download, Gem, Gamepad2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import OpenAI from 'openai';
import { SYSTEM_PROMPT } from './systemPrompt';
import { motion, AnimatePresence } from 'framer-motion';

const client = new OpenAI({
  baseURL: "/api/nvidia",
  apiKey: import.meta.env.VITE_NVIDIA_API_KEY,
  dangerouslyAllowBrowser: true 
});

const CATEGORIES = [
  { id: 0, name: "Clothing Website", icon: ShoppingBag, defaultProducts: 12 },
  { id: 1, name: "Electronics & Gadgets", icon: Monitor, defaultProducts: 10 },
  { id: 2, name: "Beauty & Skincare", icon: Sparkles, defaultProducts: 8 },
  { id: 3, name: "Home Decor & Furniture", icon: Home, defaultProducts: 15 },
  { id: 4, name: "Food & Grocery", icon: Coffee, defaultProducts: 15 },
  { id: 5, name: "Fitness & Health", icon: Activity, defaultProducts: 10 },
  { id: 6, name: "Pet Supplies", icon: Dog, defaultProducts: 12 },
  { id: 7, name: "Digital Products & AI Tools", icon: Download, defaultProducts: 5 },
  { id: 8, name: "Jewelry & Accessories", icon: Gem, defaultProducts: 10 },
  { id: 9, name: "Gaming & Anime Merchandise", icon: Gamepad2, defaultProducts: 9 },
];

const classificationPrompt = `You are an intent classifier for an ecommerce generator.
Analyze the user's request.
Determine if they want to build an ecommerce/store website.
If yes, determine the category. The categories are:
0: Clothing Website
1: Electronics & Gadgets
2: Beauty & Skincare
3: Home Decor & Furniture
4: Food & Grocery
5: Fitness & Health
6: Pet Supplies
7: Digital Products & AI Tools
8: Jewelry & Accessories
9: Gaming & Anime Merchandise

Match their intent to a category ID (0-9). If they just say "ecommerce site" or similar without specifying a niche, category is null.
Determine if they specified product count (1-20). If not, null.
Respond ONLY with valid JSON exactly in this format:
{"isEcommerce": boolean, "category": number | null, "productCount": number | null}`;

const CategoryModal = ({ onSelect }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const num = parseInt(e.key);
      if (num >= 0 && num <= 9) {
        onSelect(CATEGORIES[num]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelect]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1a1a1a] border border-[#333] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-5xl overflow-hidden"
      >
        <div className="p-8 text-center border-b border-[#333] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />
          <h2 className="text-3xl font-bold text-white mb-3 relative z-10">Select Your E-commerce Website Type</h2>
          <p className="text-[#8e8ea0] relative z-10 text-lg">Choose a category using mouse or keyboard (0–9)</p>
        </div>
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 bg-[#141414]">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat)}
                className="group relative flex flex-col items-center p-6 bg-[#212121] hover:bg-gradient-to-b hover:from-[#2a2a2a] hover:to-[#333] border border-[#3a3a3a] hover:border-[#666] rounded-2xl transition-all duration-300 text-center hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="absolute top-3 left-3 w-7 h-7 bg-black/40 rounded flex items-center justify-center text-xs font-mono text-gray-500 group-hover:text-white transition-colors border border-[#444] group-hover:border-[#666] shadow-inner">
                  {cat.id}
                </div>
                <Icon size={38} className="text-gray-500 group-hover:text-white mb-4 mt-4 transition-colors" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors leading-tight">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </motion.div>
    </div>
  );
};

const ProductModal = ({ category, onSelect }) => {
  const [count, setCount] = useState(category.defaultProducts);
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1a1a1a] border border-[#333] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden"
      >
        <div className="p-8 text-center border-b border-[#333] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 opacity-50" />
          <h2 className="text-3xl font-bold text-white mb-3 relative z-10">Product Count</h2>
          <p className="text-[#8e8ea0] relative z-10 text-lg">How many products would you like in your website?</p>
        </div>
        <div className="p-8 flex flex-col gap-8 bg-[#141414]">
          <div className="flex justify-center">
            <div className="relative group">
              <input 
                type="number" 
                min="1" max="20"
                value={count}
                onChange={(e) => {
                  let val = parseInt(e.target.value);
                  if (isNaN(val)) val = 1;
                  if (val > 20) val = 20;
                  if (val < 1) val = 1;
                  setCount(val);
                }}
                className="w-28 text-center text-4xl font-bold bg-[#212121] border-2 border-[#444] rounded-xl py-3 focus:outline-none focus:border-white text-white transition-colors"
              />
            </div>
          </div>
          
          <input 
            type="range" 
            min="1" max="20" 
            value={count} 
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full accent-white h-2 bg-[#333] rounded-lg appearance-none cursor-pointer"
          />
          
          <div className="grid grid-cols-4 gap-3">
            {[5, 10, 15, 20].map(n => (
              <button 
                key={n}
                onClick={() => setCount(n)}
                className={`py-3 rounded-xl text-sm font-bold transition-all duration-300 border ${count === n ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-[#212121] text-gray-400 border-[#3a3a3a] hover:border-[#666] hover:text-white'}`}
              >
                {n}
              </button>
            ))}
          </div>
          
          <div className="flex gap-4 mt-2">
            <button 
              onClick={() => onSelect(count)}
              className="flex-1 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg hover:shadow-xl text-lg"
            >
              Confirm
            </button>
            <button 
              onClick={() => onSelect('auto')}
              className="flex-1 py-4 bg-[#212121] text-white font-bold rounded-xl border border-[#444] hover:border-[#666] hover:bg-[#2a2a2a] transition-all text-lg"
            >
              No Preference
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const CompletionModal = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#1a1a1a] border border-[#333] rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.2)] w-full max-w-lg overflow-hidden text-center relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-50" />
        <div className="p-10 relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Sparkles size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Generation Complete</h2>
          <p className="text-[#8e8ea0] text-lg mb-8">Your enterprise-grade PRD and architecture have been successfully generated.</p>
          
          <button 
            onClick={onClose}
            className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] text-lg flex items-center justify-center gap-2"
          >
            <span>Acknowledge</span>
            <span className="text-sm font-normal opacity-70 ml-2">(Press Enter)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ImageCompletionModal = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#1a1a1a] border border-[#333] rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.2)] w-full max-w-lg overflow-hidden text-center relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-50" />
        <div className="p-10 relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <Sparkles size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Image Generation Complete</h2>
          <p className="text-[#8e8ea0] text-lg mb-8">Your premium studio image prompts have been successfully generated.</p>
          
          <button 
            onClick={onClose}
            className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-colors shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] text-lg flex items-center justify-center gap-2"
          >
            <span>Acknowledge</span>
            <span className="text-sm font-normal opacity-70 ml-2">(Press Enter)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

function App() {
  const [messages, setMessages] = useState([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showImageCompletion, setShowImageCompletion] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [setupPhase, setSetupPhase] = useState('idle'); // idle | classifying | category | products | generating
  const [pendingInput, setPendingInput] = useState('');
  const [storedCategory, setStoredCategory] = useState(null);
  const [storedProductCount, setStoredProductCount] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleGlobalCopy = (e) => {
      // Allow standard copy if user highlighted text
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const selection = window.getSelection().toString();
        if (!selection) {
          // If nothing is selected, copy the last AI response
          const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
          if (lastAssistantMessage && lastAssistantMessage.content) {
            e.preventDefault();
            const cleanContent = lastAssistantMessage.content.replace(/\*/g, '');
            navigator.clipboard.writeText(cleanContent).then(() => {
              setShowToast(true);
              setTimeout(() => setShowToast(false), 2000);
            });
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalCopy);
    return () => window.removeEventListener('keydown', handleGlobalCopy);
  }, [messages]);

  const startGeneration = async (originalInput, categoryObj, productCount) => {
    let finalInput = originalInput;
    if (categoryObj) {
      let pCount = productCount === 'auto' ? categoryObj.defaultProducts : productCount;
      finalInput += `\n\n[SYSTEM DIRECTIVE: The user wants an ecommerce website in the "${categoryObj.name}" category with exactly ${pCount} products. Please proceed to generate the multi-page ecommerce website and PRD according to these parameters.]`;
    }

    const systemMsg = { role: 'user', content: finalInput };
    
    // The user's input is already in 'messages', so we just need to swap out the last one 
    // with 'systemMsg' when sending to the API, but keep the UI looking normal.
    let currentMessages = messages;
    if (messages.length > 0 && messages[messages.length - 1].content === originalInput) {
       currentMessages = messages.slice(0, -1);
    }
    
    setSetupPhase('generating');
    setIsLoading(true);

    try {
      const completion = await client.chat.completions.create({
        model: "meta/llama-3.3-70b-instruct",
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...currentMessages, systemMsg],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 8192,
        stream: true,
      });

      let aiMessageContent = "";
      setMessages((prev) => [...prev, { role: 'assistant', content: "" }]);

      for await (const chunk of completion) {
        if (chunk.choices && chunk.choices[0].delta.content) {
          aiMessageContent += chunk.choices[0].delta.content;
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = aiMessageContent;
            return newMessages;
          });
        }
      }
      
      setShowCompletion(true);
      
    } catch (error) {
      console.error("Error calling NVIDIA API:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "**Error:** Failed to communicate with the AI. Please check your API key and connection." }]);
    } finally {
      setIsLoading(false);
      setSetupPhase('idle');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    setInput('');
    setPendingInput(currentInput);

    if (currentInput.trim().toLowerCase() === 'done') {
      generateImagePrompts();
      return;
    }

    setIsLoading(true);
    setSetupPhase('classifying');
    
    // Show the user's message immediately
    setMessages((prev) => [...prev, { role: 'user', content: currentInput }]);

    try {
      const classifierCompletion = await client.chat.completions.create({
        model: "meta/llama-3.3-70b-instruct",
        messages: [
          { role: 'system', content: classificationPrompt },
          { role: 'user', content: currentInput }
        ],
        temperature: 0.1,
      });
      
      let content = classifierCompletion.choices[0].message.content;
      const match = content.match(/\{.*\}/s);
      if (match) content = match[0];

      let classification = { isEcommerce: false, category: null, productCount: null };
      try {
        classification = JSON.parse(content);
      } catch (e) {
        console.error("Classification parsing failed", e);
      }
      
      if (classification.isEcommerce) {
        if (classification.category === null) {
          setStoredProductCount(classification.productCount);
          setSetupPhase('category');
          setIsLoading(false);
        } else {
          const catObj = CATEGORIES[classification.category] || CATEGORIES[0];
          setStoredCategory(catObj);
          if (classification.productCount === null) {
            setSetupPhase('products');
            setIsLoading(false);
          } else {
            startGeneration(currentInput, catObj, classification.productCount);
          }
        }
      } else {
        startGeneration(currentInput, null, null);
      }
      
    } catch (error) {
      console.error("Error classifying:", error);
      startGeneration(currentInput, null, null);
    }
  };

  const generateImagePrompts = async () => {
    const promptText = `[SYSTEM DIRECTIVE] The PRD is now completely generated. Done. 

Now, meticulously scan the entire PRD above. You MUST generate high-end, classic, and cinematic image prompts for EVERY SINGLE image filename mentioned in the entire document. This includes NOT ONLY product images, but also the Hero Banner, About Page images, background textures, lifestyle shots, and any other image file mentioned. All prompts must perfectly match the premium, luxury theme of the brand.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDIO PRODUCT IMAGE PROMPT GENERATION RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For ALL ecommerce product images, the AI must generate ONLY professional studio-grade product photography prompts.
The AI must NEVER generate fashion models, people, humans, lifestyle characters, crowded environments, outdoor scenes, or cinematic city backgrounds UNLESS the image explicitly requests model photography, editorial campaigns, lifestyle photography, or human-focused branding.

CORE PRODUCT IMAGE PHILOSOPHY:
Ecommerce product images must focus ONLY on the product, its materials, textures, shape, quality, lighting, shadows, and realism.

BACKGROUND RULE:
Use clean plain backgrounds, soft studio backgrounds, minimal seamless backdrops, or neutral luxury backdrops (pure white, soft ivory, muted beige, light gray, charcoal gradient, matte neutral studio backgrounds). Avoid city environments, bedrooms, streets, landscapes, random props, or distracting decorations.

PRODUCT-ONLY RULE:
The generated image must contain ONLY the product. NO people, hands, mannequins, unnecessary props, or floating accessories unless explicitly requested.

STUDIO LIGHTING & CAMERA RULE:
Use professional ecommerce studio lighting (softbox, diffused studio lighting, premium commercial lighting). Avoid harsh lighting, neon environments, or outdoor sunlight (unless explicitly requested). Use centered composition, symmetrical framing, isolated product setup. Use professional product photography language (e.g., front-facing studio composition, macro close-up detail shot, photographed on 85mm lens).

IMAGE QUALITY & MATERIAL RULE:
Clearly describe material details (fabric texture, stitching, metallic surfaces). Every product prompt must include: ultra realistic, photorealistic, ultra detailed, premium ecommerce photography, realistic shadows, soft reflections, high-end studio quality, ultra HD 8k render.

ASPECT RATIO & RESOLUTION RULE:
The aspect ratio and resolution must be embedded INSIDE the prompt itself (e.g., 1:1 aspect ratio optimized for 1200x1200 resolution). Include WebP format.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL FORMATTING RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For every single image, you MUST output the prompt exactly in this format ONLY:
"[detailed, high-quality cinematic image prompt description here, including lighting, aspect ratio, camera angle, subject, and premium aesthetic details] (filename: exact_filename.jpg)"

Notice that the entire string MUST be wrapped in double quotes "".
Inside the quotes, put the prompt text, a space, and then the filename wrapped in parentheses (filename: ...).

Example of correct format for a product:
"Ultra-realistic premium ecommerce studio product photography of a luxury oversized black hoodie made from heavyweight cotton fabric with visible stitching details and soft fleece texture, isolated product-only composition on a clean soft ivory seamless studio background, centered symmetrical framing, realistic fabric folds and premium textile depth, cinematic diffused softbox studio lighting, soft realistic shadows beneath the product, subtle fabric texture highlights, front-facing studio composition photographed on 85mm lens, photorealistic premium apparel branding aesthetic, ultra detailed cotton material, shallow depth of field, square composition, 1:1 aspect ratio optimized for 1200x1200 resolution, WebP format, ultra HD 8k render (filename: black-hoodie.jpg)"

Do not output any markdown tables, headings, bullet points, or extra conversational text. Just output the list of image prompts line by line.`;

    const displayMsg = { role: 'user', content: 'Done. Please generate premium image prompts for EVERY single image filename mentioned in the entire PRD.' };
    const systemMsg = { role: 'user', content: promptText };

    setMessages((prev) => [...prev, displayMsg]);
    setSetupPhase('generating');
    setIsLoading(true);

    try {
      const completion = await client.chat.completions.create({
        model: "meta/llama-3.3-70b-instruct",
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages, systemMsg],
        temperature: 0.3,
        top_p: 0.7,
        max_tokens: 8192,
        stream: true,
      });

      let aiMessageContent = "";
      setMessages((prev) => [...prev, { role: 'assistant', content: "" }]);

      for await (const chunk of completion) {
        if (chunk.choices && chunk.choices[0].delta.content) {
          aiMessageContent += chunk.choices[0].delta.content;
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = aiMessageContent;
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("Error calling NVIDIA API:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "**Error:** Failed to communicate with the AI. Please check your API key and connection." }]);
    } finally {
      setIsLoading(false);
      setSetupPhase('idle');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-screen bg-[#121212] text-gray-100 font-sans">
      
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-8 bg-emerald-500 text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] z-[300] flex items-center gap-2"
          >
            <Sparkles size={18} />
            Copied to clipboard!
          </motion.div>
        )}
        {showCompletion && (
          <CompletionModal onClose={() => setShowCompletion(false)} />
        )}
        {setupPhase === 'category' && (
          <CategoryModal 
            onSelect={(cat) => {
              setStoredCategory(cat);
              if (storedProductCount !== null) {
                startGeneration(pendingInput, cat, storedProductCount);
              } else {
                setSetupPhase('products');
              }
            }} 
          />
        )}
        {setupPhase === 'products' && (
          <ProductModal 
            category={storedCategory}
            onSelect={(count) => {
              startGeneration(pendingInput, storedCategory, count);
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`flex flex-col bg-[#171717] border-r border-[#303030] transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'}`}>
        <div className="p-4 flex items-center gap-3 border-b border-[#303030]">
          <img src="https://res.cloudinary.com/dmdrn1bge/image/upload/v1779031156/Create_a_premium_futuristic_AI_202605172048_a3kbgr.jpg" alt="NeoFriday" className="w-8 h-8 rounded-md object-cover" />
          <span className="font-bold text-lg">NeoFriday</span>
        </div>
        <div className="p-3">
          <button 
            onClick={() => setMessages([])}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-[#202020] transition-colors border border-[#303030] text-sm"
          >
            <Plus size={16} />
            <span>New Session</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          <div className="text-xs text-[#8e8ea0] font-semibold mb-3 px-2">Today</div>
          <button className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-[#202020] bg-[#202020] transition-colors text-sm text-left truncate">
            <MessageSquare size={16} className="shrink-0" />
            <span className="truncate">Ecommerce Generation</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-[60px] flex items-center px-4 justify-between border-b border-[#303030] lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#2f2f2f] rounded-md transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <img src="https://res.cloudinary.com/dmdrn1bge/image/upload/v1779031156/Create_a_premium_futuristic_AI_202605172048_a3kbgr.jpg" alt="NeoFriday" className="w-6 h-6 rounded-md object-cover" />
            <div className="font-semibold text-lg">NeoFriday</div>
          </div>
          <div className="w-8"></div>
        </header>

        {/* Desktop Header toggle */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="hidden lg:block absolute left-4 top-4 z-10 p-2 hover:bg-[#2f2f2f] rounded-md transition-colors text-[#8e8ea0]"
        >
          <Menu size={24} />
        </button>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(255,255,255,0.15)] transform rotate-3 overflow-hidden border-2 border-[#333]">
                <img src="https://res.cloudinary.com/dmdrn1bge/image/upload/v1779031156/Create_a_premium_futuristic_AI_202605172048_a3kbgr.jpg" alt="NeoFriday Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-4xl font-extrabold mb-4 tracking-tight">NeoFriday</h1>
              <p className="text-[#8e8ea0] max-w-xl text-lg leading-relaxed">
                Describe your dream online store, and I will generate a highly professional, multi-page ecommerce website tailored to your brand.
              </p>
            </div>
          ) : (
            <div className="flex flex-col pb-32">
              {messages.map((msg, idx) => (
                <div key={idx} className={`w-full border-b border-black/10 ${msg.role === 'assistant' ? 'bg-[#121212]' : 'bg-[#121212]'} py-8`}>
                  <div className="max-w-4xl mx-auto flex gap-6 px-6">
                    <div className="shrink-0">
                      {msg.role === 'assistant' ? (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md overflow-hidden border border-[#333]">
                          <img src="https://res.cloudinary.com/dmdrn1bge/image/upload/v1779031156/Create_a_premium_futuristic_AI_202605172048_a3kbgr.jpg" alt="AI" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-[#303030] rounded-lg flex items-center justify-center">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 w-full prose prose-invert max-w-none text-gray-200 leading-8 text-lg">
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Classifying / Loading indicator */}
              {setupPhase === 'classifying' && (
                <div className="w-full py-8">
                  <div className="max-w-4xl mx-auto flex gap-6 px-6 items-center text-[#8e8ea0]">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Analyzing intent...</span>
                  </div>
                </div>
              )}
              {setupPhase === 'generating' && messages[messages.length-1]?.role === 'user' && (
                <div className="w-full py-8">
                  <div className="max-w-4xl mx-auto flex gap-6 px-6 items-center text-[#8e8ea0]">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Generating ecommerce platform...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#121212] via-[#121212] to-transparent pt-10 pb-6 px-4">
          <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSubmit} className="relative flex items-end w-full bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-2xl overflow-hidden focus-within:border-[#555] focus-within:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your ecommerce website (e.g. 'I need a premium sneaker store')..."
                className="w-full max-h-[200px] min-h-[64px] py-4 pl-5 pr-14 bg-transparent text-gray-100 placeholder-[#666] resize-none focus:outline-none text-lg"
                rows="1"
                style={{
                  height: "auto",
                  minHeight: "64px"
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-white text-black disabled:bg-transparent disabled:text-[#444] transition-colors"
              >
                {isLoading && setupPhase !== 'idle' ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </form>
            <div className="text-center text-xs text-[#666] mt-3">
              AI behaves like a professional website consultant. Be as detailed as you like.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
