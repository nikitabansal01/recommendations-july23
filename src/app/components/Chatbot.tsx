"use client";
import React, { useState } from 'react';
import { useChatbot } from '../lib/chatbot-context';
import { useCurrentRecommendations } from '../lib/current-recommendations-context';
import styles from './Chatbot.module.css';

const Chatbot: React.FC = () => {
  const { state, dispatch, hideChatbot, resetChatbotState } = useChatbot();
  const { currentRecommendations } = useCurrentRecommendations();
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState('');
  const [culture, setCulture] = useState('');
  const [other, setOther] = useState('');
  const [showInputs, setShowInputs] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  
  // New state variables for restriction-based personalization
  const [selectedRestrictionTypes, setSelectedRestrictionTypes] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietRestrictions, setDietRestrictions] = useState<string[]>([]);
  const [cultureEthnicity, setCultureEthnicity] = useState('');
  const [otherRestrictions, setOtherRestrictions] = useState('');
  
  // New state variables for taste-based personalization
  const [selectedTasteOptions, setSelectedTasteOptions] = useState<string[]>([]);
  const [showTasteInputs, setShowTasteInputs] = useState(false);

  // State for recommendation preview
  const [previewData, setPreviewData] = useState<{
    preferences: string[];
    recommendations: Array<{title: string, specificAction: string, priority: string}>;
    isMainPageUpdated?: boolean;
  } | null>(null);

  // Get current recommendations from context
  const currentRecs = useCurrentRecommendations();

  // Location access and shop finding functionality
  const requestLocationAccess = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 Location accessed:', { latitude, longitude });
          
          // Reverse geocode to get city/state
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          console.error('❌ Location access denied:', error);
          setCurrentMessage("⚠️ Location access denied. Please enter your city and state manually.");
        }
      );
    } else {
      setCurrentMessage("⚠️ Geolocation not supported. Please enter your city and state manually.");
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
      );
      const data = await response.json();
      
      if (data.display_name) {
        const addressParts = data.display_name.split(', ');
        const city = addressParts[0];
        const state = addressParts[addressParts.length - 3] || addressParts[addressParts.length - 2];
        const cityState = `${city}, ${state}`;
        
        setLocation(cityState);
        console.log('🏙️ Reverse geocoded location:', cityState);
        
        // Find nearby shops for current recommendations without refreshing page
        findShopsForFoodItems(cityState, latitude, longitude);
      }
    } catch (error) {
      console.error('❌ Reverse geocoding failed:', error);
      setCurrentMessage("⚠️ Could not determine your city. Please enter manually.");
    }
  };

  const findNearbyShops = async (cityState: string, latitude: number, longitude: number) => {
    try {
      // Use recommendations from component level
      const foodItems = currentRecs.currentRecommendations.filter(rec => rec.category === 'food');
      
      if (foodItems.length === 0) {
        console.log('🍽️ No food recommendations to find shops for');
        setCurrentMessage(`🏪 Location set to ${cityState}! When you get food recommendations, I'll help you find nearby shops.`);
        return;
      }

      // For demo purposes, we'll simulate finding shops
      // In production, you'd integrate with Google Places API or similar
      const shopResults = await simulateShopSearch(foodItems, cityState, latitude, longitude);
      
      if (shopResults.length > 0) {
        setCurrentMessage(`🏪 Found nearby shops in ${cityState}:\n\n${shopResults.join('\n')}`);
      } else {
        setCurrentMessage(`🏪 No nearby shops found for the recommended items in ${cityState}. You can try online retailers or local health food stores.`);
      }
    } catch (error) {
      console.error('❌ Shop search failed:', error);
    }
  };



  // Set default flow when chatbot becomes visible
  React.useEffect(() => {
    console.log('🔍 Chatbot state:', { isVisible: state.isVisible, currentFlow: state.currentFlow });
    if (state.isVisible && !state.currentFlow) {
      console.log('🚀 Setting default flow to feedback');
      dispatch({ type: 'SET_FLOW', flow: 'feedback' });
    }
    
    // Clear any existing message when chatbot becomes visible
    if (state.isVisible && currentMessage) {
      console.log('🧹 Clearing existing message');
      setCurrentMessage('');
    }
  }, [state.isVisible, state.currentFlow, dispatch, currentMessage]);

  // Function to find shops for specific food items without refreshing page
  const findShopsForFoodItems = async (cityState: string, latitude: number, longitude: number) => {
    try {
      // Get current food recommendations from the page
      const foodItems = currentRecs.currentRecommendations.filter(rec => rec.category === 'food');
      
      if (foodItems.length === 0) {
        console.log('🍽️ No food recommendations to find shops for');
        setCurrentMessage(`🏪 Location set to ${cityState}! When you get food recommendations, I'll help you find nearby shops.`);
        return;
      }

      // Simulate finding shops for the current food items
      const shopResults = await simulateShopSearch(foodItems, cityState, latitude, longitude);
      
      if (shopResults.length > 0) {
        setCurrentMessage(`🏪 Found nearby shops in ${cityState}:\n\n${shopResults.join('\n')}\n\n💡 These shops are based on your current location. You can visit them to get the recommended items!`);
      } else {
        setCurrentMessage(`🏪 No nearby shops found for the recommended items in ${cityState}. You can try online retailers or local health food stores.`);
      }
    } catch (error) {
      console.error('❌ Shop search failed:', error);
    }
  };

  // Function to find shops for manually entered location
  const findShopsForManualLocation = async () => {
    console.log('🔍 Find shops button clicked!');
    console.log('📍 Current location:', location);
    
    if (!location.trim()) {
      console.log('❌ No location entered');
      setCurrentMessage("⚠️ Please enter your city and state first.");
      return;
    }

    try {
      console.log('🔍 Getting current food recommendations...');
      console.log('🔍 Current recommendations context:', currentRecs);
      console.log('🔍 Current recommendations:', currentRecs.currentRecommendations);
      
      // Get current food recommendations from the page
      const foodItems = currentRecs.currentRecommendations.filter(rec => rec.category === 'food');
      console.log('🍽️ Found food items:', foodItems);
      
      if (foodItems.length === 0) {
        console.log('❌ No food recommendations found');
        setCurrentMessage(`🏪 No food recommendations found on the page yet. Please wait for recommendations to load, then I can help you find nearby shops in ${location}!`);
        return;
      }

      console.log('🔍 Simulating shop search...');
      // Simulate finding shops for the current food items
      const shopResults = await simulateShopSearch(foodItems, location, 0, 0); // Using 0,0 for manual location
      console.log('🏪 Shop results:', shopResults);
      
      if (shopResults.length > 0) {
        setCurrentMessage(`🏪 Found nearby shops in ${location}:\n\n${shopResults.join('\n')}\n\n💡 These shops are based on your entered location. You can visit them to get the recommended items!`);
      } else {
        setCurrentMessage(`🏪 No nearby shops found for the recommended items in ${location}. You can try online retailers or local health food stores.`);
      }
    } catch (error) {
      console.error('❌ Shop search failed:', error);
      setCurrentMessage("⚠️ Sorry, I couldn't search for shops right now. Please try again later.");
    }
  };

  const simulateShopSearch = async (foodItems: Array<{title?: string}>, cityState: string, latitude: number, longitude: number) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enhanced shop database with more realistic data
    const shopDatabase = {
      'Whole Foods Market': {
        specialties: ['organic', 'natural', 'supplements', 'herbs', 'tea'],
        priceRange: '$$$',
        hours: '7 AM - 10 PM'
      },
      'Trader Joe\'s': {
        specialties: ['organic', 'affordable', 'unique items', 'seasonal'],
        priceRange: '$$',
        hours: '8 AM - 9 PM'
      },
      'Sprouts Farmers Market': {
        specialties: ['fresh produce', 'bulk items', 'supplements', 'organic'],
        priceRange: '$$',
        hours: '7 AM - 10 PM'
      },
      'Natural Grocers': {
        specialties: ['supplements', 'vitamins', 'herbs', 'organic'],
        priceRange: '$$$',
        hours: '8 AM - 9 PM'
      },
      'Local Health Food Store': {
        specialties: ['local products', 'specialty items', 'supplements'],
        priceRange: '$$',
        hours: '9 AM - 8 PM'
      },
      'CVS Pharmacy': {
        specialties: ['basic supplements', 'vitamins', 'over-the-counter'],
        priceRange: '$',
        hours: '24/7'
      },
      'Walgreens': {
        specialties: ['basic supplements', 'vitamins', 'health products'],
        priceRange: '$',
        hours: '24/7'
      },
      'Target': {
        specialties: ['general health', 'supplements', 'household items'],
        priceRange: '$$',
        hours: '8 AM - 11 PM'
      }
    };
    
    const results = [];
    
    for (const item of foodItems) {
      const itemTitle = item.title || 'Unknown Item';
      
      // Find the best shops for this specific item
      const bestShops = findBestShopsForItem(itemTitle, shopDatabase);
      
      if (bestShops.length > 0) {
        const primaryShop = bestShops[0];
        const alternatives = bestShops.slice(1, 3); // Show up to 3 alternatives
        
        let shopInfo = `📍 **${itemTitle}**\n`;
        shopInfo += `🏪 **Primary:** ${primaryShop.name} (${primaryShop.distance} miles)\n`;
        shopInfo += `   💰 Price: ${primaryShop.priceRange} | 🕒 Hours: ${primaryShop.hours}\n`;
        shopInfo += `   ✨ Specialties: ${primaryShop.specialties.join(', ')}\n`;
        
        if (alternatives.length > 0) {
          shopInfo += `\n🔄 **Alternatives:**\n`;
          alternatives.forEach(shop => {
            shopInfo += `   • ${shop.name} (${shop.distance} miles) - ${shop.priceRange}\n`;
          });
        }
        
        results.push(shopInfo);
      } else {
        // Fallback for items not found in specific shops
        const randomShop = Object.keys(shopDatabase)[Math.floor(Math.random() * Object.keys(shopDatabase).length)];
        const distance = Math.floor(Math.random() * 8) + 2; // 2-10 miles
        results.push(`📍 **${itemTitle}**\n🏪 Try: ${randomShop} (${distance} miles away)\n💡 Call ahead to check availability`);
      }
    }
    
    return results;
  };

  // Helper function to find best shops for specific items
  const findBestShopsForItem = (itemTitle: string, shopDatabase: any) => {
    const itemLower = itemTitle.toLowerCase();
    const scoredShops = [];
    
    for (const [shopName, shopData] of Object.entries(shopDatabase)) {
      let score = 0;
      const shop = shopData as any;
      
      // Enhanced scoring based on item type and shop specialties
      if (itemLower.includes('tea') || itemLower.includes('herb') || itemLower.includes('supplement')) {
        if (shop.specialties.includes('herbs') || shop.specialties.includes('supplements')) score += 3;
        if (shop.specialties.includes('organic')) score += 2;
      }
      
      if (itemLower.includes('organic') || itemLower.includes('natural')) {
        if (shop.specialties.includes('organic')) score += 3;
        if (shop.specialties.includes('natural')) score += 2;
      }
      
      if (itemLower.includes('vitamin') || itemLower.includes('mineral')) {
        if (shop.specialties.includes('supplements')) score += 3;
        if (shop.specialties.includes('vitamins')) score += 2;
      }
      
      // Add scoring for more food types
      if (itemLower.includes('fish') || itemLower.includes('salmon') || itemLower.includes('omega')) {
        if (shop.specialties.includes('organic') || shop.specialties.includes('natural')) score += 2;
        if (shop.specialties.includes('fresh produce')) score += 1;
      }
      
      if (itemLower.includes('vegetable') || itemLower.includes('fruit') || itemLower.includes('produce')) {
        if (shop.specialties.includes('fresh produce')) score += 3;
        if (shop.specialties.includes('organic')) score += 2;
      }
      
      if (itemLower.includes('seed') || itemLower.includes('nut') || itemLower.includes('flax')) {
        if (shop.specialties.includes('bulk items')) score += 2;
        if (shop.specialties.includes('organic')) score += 1;
      }
      
      if (itemLower.includes('yogurt') || itemLower.includes('kefir') || itemLower.includes('fermented')) {
        if (shop.specialties.includes('organic')) score += 2;
        if (shop.specialties.includes('fresh produce')) score += 1;
      }
      
      // Base score for all shops (so every shop gets at least some score)
      score += 1;
      
      // Add random distance (2-10 miles)
      const distance = Math.floor(Math.random() * 9) + 2;
      
      scoredShops.push({
        name: shopName,
        distance,
        priceRange: shop.priceRange,
        hours: shop.hours,
        specialties: shop.specialties,
        score
      });
    }
    
    // Sort by score (highest first) and then by distance
    return scoredShops.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.distance - b.distance;
    });
  };

  const generatePreviewRecommendations = async (preferences: string[]): Promise<Array<{title: string, specificAction: string, priority: string}>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate sample recommendations based on preferences
    const sampleRecommendations = [
      {
        title: "Local Organic Spearmint Tea",
        specificAction: "Drink 2 cups daily from local organic sources",
        priority: "High"
      },
      {
        title: "Seasonal Local Vegetables",
        specificAction: "Include 3 servings of seasonal local vegetables daily",
        priority: "Medium"
      },
      {
        title: "Cultural Diet Integration",
        specificAction: "Incorporate traditional foods from your cultural background",
        priority: "Medium"
      }
    ];
    
    return sampleRecommendations;
  };

  const acceptRecommendationChanges = () => {
    if (!previewData) return;
    
    // Show success message with the recommendations (NO PAGE REFRESH)
    setCurrentMessage(
      `✅ Perfect! Here are your approved personalized recommendations:\n\n` +
      `**Your New Food Recommendations:**\n${previewData.recommendations.map((rec, index) => 
        `${index + 1}. **${rec.title}**\n   ${rec.specificAction}\n   Priority: ${rec.priority}\n`
      ).join('\n')}\n\n` +
      `💡 These recommendations are personalized for your preferences and are ready to use!\n\n` +
      `**Note:** These are shown in the chatbot only. Your main page remains unchanged to save costs.`
    );
    
    // Clear preview data
    setPreviewData(null);
    
    // Show the message for 5 seconds, then hide chatbot
    setTimeout(() => {
      hideChatbot();
      // Clear the message after hiding
      setTimeout(() => setCurrentMessage(''), 100);
    }, 5000);
  };

  const rejectRecommendationChanges = () => {
    setCurrentMessage("❌ Got it! Your current recommendations stay the same. No changes were made to your page.");
    
    // Clear preview data
    setPreviewData(null);
    
    // Show the message for 2 seconds, then hide chatbot
    setTimeout(() => {
      hideChatbot();
      // Clear the message after hiding
      setTimeout(() => setCurrentMessage(''), 100);
    }, 2000);
  };

  const suggestMoreAlternatives = async () => {
    if (!previewData) return;
    
    try {
      setCurrentMessage("🔄 Generating alternative recommendations...");
      
      // Generate different alternatives based on the same preferences
      const alternativeRecommendations = await generateAlternativeRecommendations(previewData.preferences);
      
      // Update preview data with alternatives
      setPreviewData({ 
        preferences: previewData.preferences, 
        recommendations: alternativeRecommendations 
      });
      
      // Show the new alternatives with a simple message
      const alternativesMessage = `🔄 **Alternative Recommendations**\n\n` +
        `**Based on your preferences:** ${previewData.preferences.join(', ')}\n\n` +
        `**🆕 New alternatives to try:**\n${alternativeRecommendations.map((rec, index) => 
          `${index + 1}. **${rec.title}**\n   ${rec.specificAction}\n   Priority: ${rec.priority}\n`
        ).join('\n')}\n\n` +
        `**Review these alternatives, then decide:**\n` +
        `✅ I love these - Keep them\n` +
        `🔄 I'd like different options\n` +
        `❌ I prefer my current ones`;
      
      setCurrentMessage(alternativesMessage);
      
    } catch (error) {
      console.error('❌ Failed to generate alternatives:', error);
      setCurrentMessage("⚠️ Sorry, I couldn't generate alternatives. Please try again.");
    }
  };

  const generateAlternativeRecommendations = async (preferences: string[]): Promise<Array<{title: string, specificAction: string, priority: string}>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate different alternative recommendations
    const alternativeRecommendations = [
      {
        title: "Adaptogenic Herbs for Hormone Balance",
        specificAction: "Take 500mg ashwagandha and 300mg rhodiola daily",
        priority: "High"
      },
      {
        title: "Fermented Foods for Gut Health",
        specificAction: "Include 1 serving of kimchi, sauerkraut, or kefir daily",
        priority: "Medium"
      },
      {
        title: "Anti-inflammatory Spices",
        specificAction: "Add turmeric, ginger, and cinnamon to meals daily",
        priority: "Medium"
      }
    ];
    
    return alternativeRecommendations;
  };

  if (!state.isVisible) {
    console.log('🚫 Chatbot not visible');
    return null;
  }

  console.log('✅ Chatbot is visible, currentFlow:', state.currentFlow);

  // Show current message if set
  if (currentMessage) {
    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.avatar}>🤖</div>
            <h3>Health Coach</h3>
            <button className={styles.closeButton} onClick={hideChatbot}>
              ×
            </button>
          </div>
          <div className={styles.messages}>
            <div className={styles.message}>
              {currentMessage}
            </div>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              {previewData ? (
                // Show accept/reject/suggest more buttons for immediate recommendations
                <>
                  <button 
                    onClick={() => handleImmediateRecommendationAction('accept')}
                    style={{ 
                      padding: '12px 24px', 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      fontSize: '16px',
                      marginRight: '15px',
                      fontWeight: '600'
                    }}
                  >
                    ✅ I love these - Keep them
                  </button>
                  <button 
                    onClick={() => handleImmediateRecommendationAction('suggest')}
                    style={{ 
                      padding: '12px 24px', 
                      backgroundColor: '#ffc107', 
                      color: '#212529', 
                      border: 'none', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      fontSize: '16px',
                      marginRight: '15px',
                      fontWeight: '600'
                    }}
                  >
                    🔄 I'd like different options
                  </button>
                  <button 
                    onClick={() => handleImmediateRecommendationAction('reject')}
                    style={{ 
                      padding: '12px 24px', 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      fontSize: '16px',
                      marginRight: '15px',
                      fontWeight: '600'
                    }}
                  >
                    ❌ I prefer my current ones
                  </button>
                  {previewData?.isMainPageUpdated && (
                    <button 
                      onClick={() => handleImmediateRecommendationAction('viewNew')}
                      style={{ 
                        padding: '12px 24px', 
                        backgroundColor: '#17a2b8', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        marginTop: '10px'
                      }}
                    >
                      🎯 View New Recommendations
                    </button>
                  )}
                </>
              ) : (
                // Show regular close buttons
                <>
                  <button 
                    onClick={() => {
                      console.log('🚪 User manually closing chatbot');
                      setCurrentMessage('');
                      hideChatbot();
                    }}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#28a745', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginRight: '10px'
                    }}
                  >
                    ✅ Got it, thanks!
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentMessage('');
                      resetChatbotState();
                      dispatch({ type: 'SET_FLOW', flow: 'feedback' });
                    }}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#007bff', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🔄 Reset Chatbot
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleFeedback = (rating: 'liked' | 'disliked' | 'changes') => {
    console.log('🎯 Feedback received:', rating);
    dispatch({ type: 'SET_FEEDBACK', rating });
    
    if (rating === 'liked') {
      // Show positive feedback and celebration
      console.log('✅ User liked the plan, showing celebration message');
      setCurrentMessage("🎉 Yayyy!!! Let's go with this plan today! You're going to feel amazing! 💪✨");
      
      // Hide chatbot after 3 seconds
      setTimeout(() => {
        console.log('🕐 3 seconds passed, hiding chatbot');
        hideChatbot();
      }, 3000);
      
      // Also mark that feedback was given to prevent showing again
      console.log('📝 Marking feedback as given for today');
    } else if (rating === 'disliked' || rating === 'changes') {
      // Show feedback reason question
      console.log('❌ User disliked or wants changes, showing feedback reason question');
      dispatch({ type: 'SET_FLOW', flow: 'feedback-reason' });
    }
  };

  const handleFeedbackReason = (reason: 'unavailable' | 'restrictions' | 'taste' | 'too-hard' | 'too-easy') => {
    console.log('🎯 Feedback reason received:', reason);
    dispatch({ type: 'SET_FEEDBACK_REASON', reason });
    
    if (reason === 'unavailable') {
      // Show food item selection for "Can't get it" option
      dispatch({ type: 'SET_FLOW', flow: 'select-food-item' });
    } else if (reason === 'restrictions') {
      // Show restriction-based food item selection flow
      console.log('🚫 User has restrictions, showing restriction-based food selection');
      dispatch({ type: 'SET_FLOW', flow: 'select-restriction-food-item' });
    } else if (reason === 'taste') {
      // Show taste-based food item selection flow
      console.log('😐 User doesn&apos;t enjoy the taste, showing taste-based food selection');
      dispatch({ type: 'SET_FLOW', flow: 'select-taste-food-item' });
    } else if (reason === 'too-hard') {
      // Show too-hard-based item selection flow
      console.log('🏋️ User finds it too hard, showing too-hard-based selection');
      dispatch({ type: 'SET_FLOW', flow: 'select-too-hard-item' });
    } else {
      // Show thank you message and close chatbot for other reasons
      setCurrentMessage("Thank you for your feedback! I'll use this to improve your recommendations. Have a great day! ✨");
      
      // Hide chatbot after 3 seconds
      setTimeout(() => {
        console.log('🕐 3 seconds passed, hiding chatbot');
        hideChatbot();
      }, 3000);
    }
  };

  const renderFeedbackFlow = () => (
    <div className={styles.flowContainer}>
      <div className={styles.botMessage}>
        <strong>Hey, did you like today&apos;s action plan?</strong>
      </div>
      <div className={styles.options}>
        <button 
          className={styles.optionButton}
          onClick={() => handleFeedback('liked')}
        >
          Yes, I liked it 👍
        </button>
        <button 
          className={styles.optionButton}
          onClick={() => handleFeedback('disliked')}
        >
          Not really 👎
        </button>
        <button 
          className={styles.optionButton}
          onClick={() => handleFeedback('changes')}
        >
          I&apos;d like to make changes ✏️
        </button>
      </div>
    </div>
  );

  const renderFeedbackReasonFlow = () => (
    <div className={styles.flowContainer}>
      <div className={styles.botMessage}>
        <strong>💬 Got it — can you tell me why you didn&apos;t like the recommendations? This will help me make them better for you.</strong>
      </div>
      <div className={styles.options}>
        <button 
          className={styles.optionButton}
          onClick={() => handleFeedbackReason('unavailable')}
        >
          🛒 Can&apos;t get it – Not available where I live
        </button>
        <button 
          className={styles.optionButton}
          onClick={() => handleFeedbackReason('restrictions')}
        >
          🚫 Can&apos;t have it – Allergies, diet, or health restriction
        </button>
        <button 
          className={styles.optionButton}
          onClick={() => handleFeedbackReason('taste')}
        >
          😐 Don&apos;t enjoy it – Not my taste or preferred style
        </button>
        <button 
          className={styles.optionButton}
          onClick={() => handleFeedbackReason('too-hard')}
        >
          🏋️ Too hard – Requires more effort/time than I can give
        </button>
        <button 
          className={styles.optionButton}
          onClick={() => handleFeedbackReason('too-easy')}
        >
          💤 Too easy/low impact – Doesn&apos;t feel effective enough
        </button>
      </div>
    </div>
  );

  const renderRestrictionFoodItemSelectionFlow = () => {
    // Debug: Log recommendations to see what we're working with
    console.log('🎯 Chatbot received recommendations for restrictions:', currentRecommendations);
    
    // Filter to show ONLY FOOD recommendations
    const foodRecommendations = currentRecommendations?.filter(rec => rec.category === 'food') || [];
    
    console.log('🍽️ Food recommendations to show for restrictions:', foodRecommendations);

    return (
      <div className={styles.flowContainer}>
        <div className={styles.botMessage}>
          <strong>Which food recommendation are you referring to?</strong>
        </div>
        <div className={styles.options}>
          {/* Show actual food recommendations from LLM */}
          {foodRecommendations.length > 0 ? (
            foodRecommendations.map((rec, index) => (
              <button 
                key={index}
                className={styles.optionButton}
                onClick={() => {
                  dispatch({ type: 'SELECT_RESTRICTION_FOOD_ITEM', foodItem: rec.title || rec.specificAction || `Food Item ${index + 1}` });
                  dispatch({ type: 'SET_FLOW', flow: 'restriction-personalization-options' });
                }}
              >
                🍽️ {rec.title || rec.specificAction || `Food Item ${index + 1}`}
              </button>
            ))
          ) : (
            <div className={styles.noRecommendations}>
              <p>No food recommendations found. Please select &quot;Other&quot; below.</p>
            </div>
          )}
          
          {/* Always show "Other" option */}
          <button 
            className={styles.optionButton}
            onClick={() => {
              dispatch({ type: 'SELECT_RESTRICTION_FOOD_ITEM', foodItem: 'Other' });
              dispatch({ type: 'SET_FLOW', flow: 'restriction-personalization-options' });
            }}
          >
            📝 Other (specify)
          </button>
        </div>
      </div>
    );
  };

  const renderFoodItemSelectionFlow = () => {
    // Debug: Log recommendations to see what we're working with
    console.log('🎯 Chatbot received recommendations:', currentRecommendations);
    console.log('🎯 Recommendations type:', typeof currentRecommendations);
    console.log('🎯 Recommendations length:', currentRecommendations?.length);
    console.log('🎯 First recommendation:', currentRecommendations?.[0]);
    
    // Filter to show ONLY FOOD recommendations
    const foodRecommendations = currentRecommendations?.filter(rec => rec.category === 'food') || [];
    
    console.log('🍽️ Food recommendations to show:', foodRecommendations);

    return (
      <div className={styles.flowContainer}>
        <div className={styles.botMessage}>
          <strong>Which food recommendation are you referring to?</strong>
        </div>
        <div className={styles.options}>
          {/* Show actual food recommendations from LLM */}
          {foodRecommendations.length > 0 ? (
            foodRecommendations.map((rec, index) => (
              <button 
                key={index}
                className={styles.optionButton}
                onClick={() => {
                  dispatch({ type: 'SELECT_FOOD_ITEM', foodItem: rec.title || rec.specificAction || `Food Item ${index + 1}` });
                  dispatch({ type: 'SET_FLOW', flow: 'personalization-options' });
                }}
              >
                🍽️ {rec.title || rec.specificAction || `Food Item ${index + 1}`}
              </button>
            ))
          ) : (
            <div className={styles.noRecommendations}>
              <p>No food recommendations found. Please select &quot;Other&quot; below.</p>
            </div>
          )}
          
          {/* Always show "Other" option */}
          <button 
            className={styles.optionButton}
            onClick={() => {
              dispatch({ type: 'SELECT_FOOD_ITEM', foodItem: 'Other' });
              dispatch({ type: 'SET_FLOW', flow: 'personalization-options' });
            }}
          >
            📝 Other (specify)
          </button>
        </div>
      </div>
    );
  };

  const renderRestrictionPersonalizationOptionsFlow = () => {
    if (showInputs) {
      return (
        <div className={styles.flowContainer}>
          <div className={styles.botMessage}>
            <strong>Please provide your preferences:</strong>
          </div>
          
          {selectedRestrictionTypes.includes('allergies') && renderAllergiesOptions()}
          {selectedRestrictionTypes.includes('diet') && renderDietRestrictionsOptions()}
          {selectedRestrictionTypes.includes('culture') && renderCultureEthnicityOptions()}
          {selectedRestrictionTypes.includes('other') && renderOtherRestrictionsOptions()}
          
          <div className={styles.buttonGroup}>
            <button 
              className={styles.submitButton}
              onClick={handleRestrictionSubmit}
              disabled={selectedRestrictionTypes.length === 0}
            >
              ✅ Submit Preferences
            </button>
            <button 
              className={styles.backButton}
              onClick={() => setShowInputs(false)}
            >
              🔙 Back to Options
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.flowContainer}>
        <div className={styles.botMessage}>
          <strong>Would you like me to personalize based on your:</strong>
        </div>
        <div className={styles.optionsGrid}>
          <div 
            className={`${styles.optionCard} ${selectedRestrictionTypes.includes('allergies') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedRestrictionTypes.includes('allergies')) {
                setSelectedRestrictionTypes(selectedRestrictionTypes.filter(type => type !== 'allergies'));
              } else {
                setSelectedRestrictionTypes([...selectedRestrictionTypes, 'allergies']);
              }
            }}
          >
            <div className={styles.optionIcon}>🚫</div>
            <div className={styles.optionText}>Food allergies</div>
            {selectedRestrictionTypes.includes('allergies') && <div className={styles.checkmark}>✓</div>}
          </div>
          
          <div 
            className={`${styles.optionCard} ${selectedRestrictionTypes.includes('diet') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedRestrictionTypes.includes('diet')) {
                setSelectedRestrictionTypes(selectedRestrictionTypes.filter(type => type !== 'diet'));
              } else {
                setSelectedRestrictionTypes([...selectedRestrictionTypes, 'diet']);
              }
            }}
          >
            <div className={styles.optionIcon}>🥗</div>
            <div className={styles.optionText}>Diet restrictions</div>
            {selectedRestrictionTypes.includes('diet') && <div className={styles.checkmark}>✓</div>}
          </div>
          
          <div 
            className={`${styles.optionCard} ${selectedRestrictionTypes.includes('culture') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedRestrictionTypes.includes('culture')) {
                setSelectedRestrictionTypes(selectedRestrictionTypes.filter(type => type !== 'culture'));
              } else {
                setSelectedRestrictionTypes([...selectedRestrictionTypes, 'culture']);
              }
            }}
          >
            <div className={styles.optionIcon}>🌍</div>
            <div className={styles.optionText}>Culture/ethnicity</div>
            {selectedRestrictionTypes.includes('culture') && <div className={styles.checkmark}>✓</div>}
          </div>
          
          <div 
            className={`${styles.optionCard} ${selectedRestrictionTypes.includes('other') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedRestrictionTypes.includes('other')) {
                setSelectedRestrictionTypes(selectedRestrictionTypes.filter(type => type !== 'other'));
              } else {
                setSelectedRestrictionTypes([...selectedRestrictionTypes, 'other']);
              }
            }}
          >
            <div className={styles.optionIcon}>📝</div>
            <div className={styles.optionText}>Other</div>
            {selectedRestrictionTypes.includes('other') && <div className={styles.checkmark}>✓</div>}
          </div>
        </div>
        
        <div className={styles.nextStepButton}>
          <button 
            className={styles.nextButton}
            onClick={() => setShowInputs(true)}
            disabled={selectedRestrictionTypes.length === 0}
          >
            🚀 Next Step: Provide Details
          </button>
        </div>
      </div>
    );
  };

  const handleRestrictionSubmit = () => {
    console.log('🚀 Submit button clicked!');
    console.log('📊 Current state:', {
      selectedRestrictionTypes,
      allergies,
      dietRestrictions,
      cultureEthnicity,
      otherRestrictions
    });
    
    const preferences = [];
    
    if (selectedRestrictionTypes.includes('allergies') && allergies.length > 0) {
      preferences.push(`Allergies: ${allergies.join(', ')}`);
    }
    if (selectedRestrictionTypes.includes('diet') && dietRestrictions.length > 0) {
      preferences.push(`Diet restrictions: ${dietRestrictions.join(', ')}`);
    }
    if (selectedRestrictionTypes.includes('culture') && cultureEthnicity) {
      preferences.push(`Culture/Ethnicity: ${cultureEthnicity}`);
    }
    if (selectedRestrictionTypes.includes('other') && otherRestrictions) {
      preferences.push(`Other restrictions: ${otherRestrictions}`);
    }
    
    console.log('🎯 Preferences to submit:', preferences);
    
    if (preferences.length === 0) {
      console.log('❌ No preferences to submit, showing error');
      setCurrentMessage("⚠️ Please fill in at least one field before submitting.");
      return;
    }
    
    // Store preferences in chatbot state
    dispatch({ type: 'SET_PERSONALIZATION_PREFERENCES', preferences });
    
    setCurrentMessage("🎯 Personalizing according to your restrictions... Generating safe recommendations for you! ✨");
    
    // Show the message for 2 seconds, then hide chatbot
    setTimeout(() => {
      hideChatbot();
      // Clear the message after hiding
      setTimeout(() => setCurrentMessage(''), 100);
    }, 2000);
  };

    const renderAllergiesOptions = () => (
      <div className={styles.inputGroup}>
        <label>🚫 What are you allergic to?</label>
        <div className={styles.checkboxOptions}>
          {['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy', 'Fish', 'Wheat'].map((allergy) => (
            <div 
              key={allergy} 
              className={`${styles.checkboxOption} ${allergies.includes(allergy) ? styles.selected : ''}`}
              onClick={() => {
                if (allergies.includes(allergy)) {
                  setAllergies(allergies.filter(a => a !== allergy));
                } else {
                  setAllergies([...allergies, allergy]);
                }
              }}
            >
              {allergy}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Other allergies (comma separated)"
          value={allergies.filter(a => !['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy', 'Fish', 'Wheat'].includes(a)).join(', ')}
          onChange={(e) => {
            const otherAllergies = e.target.value.split(',').map(a => a.trim()).filter(a => a);
            const commonAllergies = allergies.filter(a => ['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy', 'Fish', 'Wheat'].includes(a));
            setAllergies([...commonAllergies, ...otherAllergies]);
          }}
          className={styles.textInput}
        />
      </div>
    );

    const renderDietRestrictionsOptions = () => (
      <div className={styles.inputGroup}>
        <label>🥗 What are your diet restrictions?</label>
        <div className={styles.checkboxOptions}>
          {['Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Low-carb', 'Low-sodium', 'Low-sugar', 'Halal', 'Kosher'].map((diet) => (
            <div 
              key={diet} 
              className={`${styles.checkboxOption} ${dietRestrictions.includes(diet) ? styles.selected : ''}`}
              onClick={() => {
                if (dietRestrictions.includes(diet)) {
                  setDietRestrictions(dietRestrictions.filter(d => d !== diet));
                } else {
                  setDietRestrictions([...dietRestrictions, diet]);
                }
              }}
            >
              {diet}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Other diet restrictions (comma separated)"
          value={dietRestrictions.filter(d => !['Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Low-carb', 'Low-sodium', 'Low-sugar', 'Halal', 'Kosher'].includes(d)).join(', ')}
          onChange={(e) => {
            const otherDiets = e.target.value.split(',').map(d => d.trim()).filter(d => d);
            const commonDiets = dietRestrictions.filter(d => ['Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Low-carb', 'Low-sodium', 'Low-sugar', 'Halal', 'Kosher'].includes(d));
            setDietRestrictions([...commonDiets, ...otherDiets]);
          }}
          className={styles.textInput}
        />
      </div>
    );

    const renderCultureEthnicityOptions = () => (
      <div className={styles.inputGroup}>
        <label>🌍 What&apos;s your cultural background?</label>
        <select
          value={cultureEthnicity}
          onChange={(e) => setCultureEthnicity(e.target.value)}
          className={styles.selectInput}
        >
          <option value="">Select your culture/ethnicity</option>
          <option value="South Asian">South Asian</option>
          <option value="East Asian">East Asian</option>
          <option value="Middle Eastern">Middle Eastern</option>
          <option value="Mediterranean">Mediterranean (Italian, Greek, Turkish)</option>
          <option value="Western/American/European">Western / American / European</option>
          <option value="Other">Other (tell us)</option>
        </select>
        {cultureEthnicity === 'Other' && (
          <input
            type="text"
            placeholder="Please specify your culture/ethnicity"
            value={otherRestrictions}
            onChange={(e) => setOtherRestrictions(e.target.value)}
            className={styles.textInput}
          />
        )}
      </div>
    );

    const renderOtherRestrictionsOptions = () => (
      <div className={styles.inputGroup}>
        <label>📝 What other restrictions do you have?</label>
        <textarea
          placeholder="Please describe any other health restrictions, medical conditions, or dietary needs..."
          value={otherRestrictions}
          onChange={(e) => setOtherRestrictions(e.target.value)}
          className={styles.textarea}
          rows={4}
        />
      </div>
    );

  const handleSubmit = () => {
    console.log('🚀 Submit button clicked!');
    console.log('📍 Location:', location);
    console.log('🌤️ Weather:', weather);
    console.log('🌍 Culture:', culture);
    console.log('📝 Other:', other);
    
    const preferences = [];
    if (location) preferences.push(`Location: ${location}`);
    if (weather) preferences.push(`Weather: ${weather}`);
    if (culture) preferences.push(`Culture: ${culture}`);
    if (other) preferences.push(`Other: ${other}`);
    
    console.log('📋 Collected preferences:', preferences);
    
    // Store preferences in chatbot state
    dispatch({ type: 'SET_PERSONALIZATION_PREFERENCES', preferences });
    
    // Immediately show new recommendations without requiring approval first
    showImmediateRecommendations(preferences);
  };

  const showImmediateRecommendations = async (preferences: string[]) => {
    try {
      setCurrentMessage("🎯 Generating personalized recommendations based on your preferences...");
      
      // Get current recommendations for comparison
      const currentFoodRecs = currentRecs.currentRecommendations.filter(rec => rec.category === 'food');
      
      // Generate new recommendations based on preferences
      const newRecommendations = await generatePersonalizedRecommendations(preferences);
      
      // Show the new recommendations immediately
      const recommendationsMessage = createImmediateRecommendationsDisplay(
        newRecommendations, 
        preferences
      );
      
      setCurrentMessage(recommendationsMessage);
      
      // Store the recommendations data for potential future use
      setPreviewData({ preferences, recommendations: newRecommendations });
      
      // Also reload the main page recommendations with new preferences
      await reloadMainPageRecommendations(preferences);
      
    } catch (error) {
      console.error('❌ Failed to generate recommendations:', error);
      setCurrentMessage("⚠️ Sorry, I couldn't generate personalized recommendations right now. Please try again.");
    }
  };

  // Function to reload main page recommendations based on user preferences
  const reloadMainPageRecommendations = async (preferences: string[]) => {
    try {
      console.log('🔄 Reloading main page recommendations with preferences:', preferences);
      
      // Create a comprehensive prompt for the LLM
      const prompt = createLLMPromptForRecommendations(preferences);
      
      // Call the LLM API to get new recommendations
      const response = await fetch('/api/llm-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          preferences: preferences
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🤖 LLM response for new recommendations:', data);
      
      // Update the current recommendations context with new recommendations
      if (data.recommendations && Array.isArray(data.recommendations)) {
        console.log('✅ Updating recommendations context with new data');
        
        // Update the current recommendations context
        currentRecs.updateRecommendations(data.recommendations);
        
        // Show success message with option to view new recommendations
        setCurrentMessage(prev => prev + '\n\n🎯 **Your main page recommendations have been updated!**\n\n' +
          '**New personalized recommendations are now active on the main page.**\n\n' +
          '**Options:**\n' +
          '✅ **View New Recommendations** - See your updated recommendations\n' +
          '🔄 **Generate Different Options** - Get alternative suggestions\n' +
          '❌ **Keep Current Ones** - Revert to previous recommendations');
        
        // Store the new recommendations for potential use
        setPreviewData({ 
          preferences, 
          recommendations: data.recommendations,
          isMainPageUpdated: true 
        });
        
      } else {
        console.log('❌ No recommendations data in LLM response');
        setCurrentMessage(prev => prev + '\n\n⚠️ **Could not update main page recommendations.**\n\nPlease try again or contact support.');
      }
      
    } catch (error) {
      console.error('❌ Failed to reload main page recommendations:', error);
      setCurrentMessage(prev => prev + '\n\n⚠️ **Failed to update main page recommendations.**\n\nPlease try again later.');
    }
  };

  const createLLMPromptForRecommendations = (preferences: string[]) => {
    let prompt = `Generate personalized hormone health recommendations considering the following factors:\n\n`;
    
    // Add user's preferences
    prompt += `**User's Preferences:**\n`;
    preferences.forEach(pref => {
      prompt += `• ${pref}\n`;
    });
    prompt += `\n`;
    
    // Add specific instructions for weather-based recommendations
    if (preferences.some(p => p.startsWith('Weather:'))) {
      const weather = preferences.find(p => p.startsWith('Weather:'))?.split(': ')[1];
      if (weather?.toLowerCase().includes('hot')) {
        prompt += `**Special Instructions for Hot Weather:**\n`;
        prompt += `• Suggest cooling, hydrating foods and drinks that support hormone balance\n`;
        prompt += `• Include spearmint tea, cucumber-mint water, coconut water\n`;
        prompt += `• Focus on light, cooling proteins and hydrating fruits\n`;
        prompt += `• Consider foods that help with heat management and hormone regulation\n\n`;
      } else if (weather?.toLowerCase().includes('cold')) {
        prompt += `**Special Instructions for Cold Weather:**\n`;
        prompt += `• Suggest warming, nourishing foods that support hormone balance\n`;
        prompt += `• Include ginger, cinnamon, turmeric tea\n`;
        prompt += `• Focus on root vegetables, warming spices, and hearty soups\n`;
        prompt += `• Consider foods that provide warmth and hormone support\n\n`;
      }
    }
    
    // Add culture-based instructions
    if (preferences.some(p => p.startsWith('Culture:'))) {
      prompt += `**Cultural Considerations:**\n`;
      prompt += `• Incorporate traditional foods and cooking methods from the user's cultural background\n`;
      prompt += `• Adapt recommendations to cultural dietary preferences\n`;
      prompt += `• Include culturally relevant hormone-balancing foods\n\n`;
    }
    
    prompt += `**Requirements:**\n`;
    prompt += `• Generate 3-4 food recommendations\n`;
    prompt += `• Generate 2-3 movement recommendations\n`;
    prompt += `• Generate 2-3 mindfulness recommendations\n`;
    prompt += `• All recommendations should support hormone balance\n`;
    prompt += `• Make recommendations practical and actionable\n`;
    prompt += `• Consider the user's location, weather, and cultural background\n\n`;
    
    prompt += `Format the response as a JSON object with categories: food, movement, mindfulness.`;
    
    return prompt;
  };

  const generatePersonalizedRecommendations = async (preferences: string[]): Promise<Array<{title: string, specificAction: string, priority: string}>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate more specific recommendations based on preferences
    const recommendations = [];
    
    // Location-based recommendations
    if (preferences.some(p => p.startsWith('Location:'))) {
      recommendations.push({
        title: "Local Seasonal Produce",
        specificAction: "Visit local farmers markets for fresh, seasonal vegetables and fruits",
        priority: "High"
      });
      
      if (preferences.some(p => p.includes('CA') || p.includes('California'))) {
        recommendations.push({
          title: "California Avocados & Citrus",
          specificAction: "Include 1/2 avocado and 1 citrus fruit daily for hormone balance",
          priority: "Medium"
        });
      }
    }
    
    // Enhanced Weather-based recommendations with hormone-friendly considerations
    if (preferences.some(p => p.startsWith('Weather:'))) {
      const weather = preferences.find(p => p.startsWith('Weather:'))?.split(': ')[1];
      
      if (weather?.toLowerCase().includes('hot') || weather?.toLowerCase().includes('summer')) {
        // Hot weather - cooling, hydrating foods that support hormone balance
        recommendations.push({
          title: "Cooling Hormone-Friendly Drinks",
          specificAction: "Drink 2-3 cups of spearmint tea, cucumber-mint water, or coconut water daily to cool your body and support hormone regulation",
          priority: "High"
        });
        
        recommendations.push({
          title: "Hydrating Summer Fruits",
          specificAction: "Include watermelon, berries, and citrus fruits daily for hydration and antioxidant support for hormone health",
          priority: "Medium"
        });
        
        recommendations.push({
          title: "Light Cooling Proteins",
          specificAction: "Choose lighter proteins like grilled fish, tofu, or lean chicken with cooling herbs like mint and cilantro",
          priority: "Medium"
        });
        
      } else if (weather?.toLowerCase().includes('cold') || weather?.toLowerCase().includes('winter')) {
        // Cold weather - warming, nourishing foods that support hormone balance
        recommendations.push({
          title: "Warming Hormone-Supporting Herbs",
          specificAction: "Drink 2-3 cups of ginger, cinnamon, or turmeric tea daily to warm your body and support hormone regulation",
          priority: "High"
        });
        
        recommendations.push({
          title: "Nourishing Winter Root Vegetables",
          specificAction: "Include sweet potatoes, carrots, and beets daily for warming energy and hormone-supporting nutrients",
          priority: "Medium"
        });
        
        recommendations.push({
          title: "Warming Spices & Soups",
          specificAction: "Use warming spices like ginger, cinnamon, and black pepper in soups and stews for hormone balance",
          priority: "Medium"
        });
        
      } else if (weather?.toLowerCase().includes('humid')) {
        // Humid weather - foods that help with moisture regulation and hormone balance
        recommendations.push({
          title: "Moisture-Balancing Foods",
          specificAction: "Include bitter greens, cucumber, and light proteins to help balance moisture and support hormone regulation",
          priority: "High"
        });
        
        recommendations.push({
          title: "Light Digestive Support",
          specificAction: "Include ginger tea, fennel seeds, and light meals to support digestion in humid conditions",
          priority: "Medium"
        });
        
      } else if (weather?.toLowerCase().includes('dry')) {
        // Dry weather - hydrating and nourishing foods
        recommendations.push({
          title: "Hydrating Hormone Support",
          specificAction: "Drink 3-4 cups of herbal teas (chamomile, spearmint) and include hydrating foods like cucumber and watermelon",
          priority: "High"
        });
        
        recommendations.push({
          title: "Nourishing Healthy Fats",
          specificAction: "Include avocado, nuts, and olive oil daily to support hormone production in dry conditions",
          priority: "Medium"
        });
      }
    }
    
    // Enhanced Culture-based recommendations
    if (preferences.some(p => p.startsWith('Culture:'))) {
      const culture = preferences.find(p => p.startsWith('Culture:'))?.split(': ')[1];
      if (culture?.toLowerCase().includes('indian')) {
        recommendations.push({
          title: "Traditional Indian Hormone-Balancing Spices",
          specificAction: "Use turmeric, cumin, coriander, and fenugreek in daily cooking for hormone regulation and digestive health",
          priority: "High"
        });
        
        recommendations.push({
          title: "Ayurvedic Cooling Foods",
          specificAction: "Include cooling foods like cucumber raita, mint chutney, and coconut-based dishes for hormone balance",
          priority: "Medium"
        });
        
      } else if (culture?.toLowerCase().includes('mediterranean')) {
        recommendations.push({
          title: "Mediterranean Hormone-Supporting Diet",
          specificAction: "Include olive oil, nuts, fatty fish, and plenty of vegetables 3-4 times per week for hormone balance",
          priority: "High"
        });
        
        recommendations.push({
          title: "Greek Yogurt & Fermented Foods",
          specificAction: "Include Greek yogurt, olives, and fermented vegetables daily for gut health and hormone regulation",
          priority: "Medium"
        });
        
      } else if (culture?.toLowerCase().includes('asian')) {
        recommendations.push({
          title: "Asian Healing Foods for Hormones",
          specificAction: "Include ginger, green tea, miso, and fermented foods daily for hormone balance and digestive health",
          priority: "High"
        });
        
        recommendations.push({
          title: "Traditional Asian Herbs",
          specificAction: "Use herbs like ginseng, astragalus, and goji berries in teas or soups for hormone support",
          priority: "Medium"
        });
      }
    }
    
    // Core hormone-balancing recommendations (always included)
    recommendations.push({
      title: "Omega-3 Rich Foods for Hormone Balance",
      specificAction: "Include fatty fish (salmon, sardines), flaxseeds, or walnuts 3-4 times per week for hormone regulation",
      priority: "High"
    });
    
    recommendations.push({
      title: "Probiotic-Rich Foods for Gut-Hormone Axis",
      specificAction: "Include yogurt, kefir, or fermented vegetables daily to support gut health and hormone regulation",
      priority: "High"
    });
    
    recommendations.push({
      title: "Fiber-Rich Foods for Hormone Metabolism",
      specificAction: "Include 25-30g of fiber daily from vegetables, fruits, and whole grains for proper hormone metabolism",
      priority: "Medium"
    });
    
    // Ensure we have at least 5 recommendations
    while (recommendations.length < 5) {
      recommendations.push({
        title: "Balanced Hormone-Supporting Meals",
        specificAction: "Plan meals with lean protein, healthy fats, complex carbs, and plenty of vegetables for hormone balance",
        priority: "Medium"
      });
    }
    
    return recommendations.slice(0, 6); // Return max 6 recommendations
  };

  const createImmediateRecommendationsDisplay = (
    recommendations: Array<{title: string, specificAction: string, priority: string}>,
    preferences: string[]
  ) => {
    const recommendationsList = recommendations.map((rec, index) => 
      `${index + 1}. **${rec.title}**\n   ${rec.specificAction}\n   Priority: ${rec.priority}\n`
    ).join('\n');

    return `🎯 **Your Personalized Recommendations**\n\n` +
           `**Based on your preferences:** ${preferences.join(', ')}\n\n` +
           `**🆕 Your NEW personalized recommendations:**\n${recommendationsList}\n\n` +
           `**What's special about these:**\n` +
           `• Tailored to your location and preferences\n` +
           `• Consider your cultural background\n` +
           `• Optimized for your current situation\n\n` +
           `**Next steps:**\n` +
           `✅ I love these - Keep them\n` +
           `🔄 I'd like different options\n` +
           `❌ I prefer my current ones\n\n` +
           `**🔄 Main page recommendations are being updated with your preferences!**`;
  };

  // Update the action buttons for immediate recommendations
  const handleImmediateRecommendationAction = (action: 'accept' | 'reject' | 'suggest' | 'viewNew') => {
    if (action === 'accept') {
      setCurrentMessage(
        `✅ Perfect! Your personalized recommendations are now active:\n\n` +
        `**Your Approved Recommendations:**\n${previewData?.recommendations.map((rec, index) => 
          `${index + 1}. **${rec.title}**\n   ${rec.specificAction}\n   Priority: ${rec.priority}\n`
        ).join('\n')}\n\n` +
        `💡 These recommendations are personalized for your preferences and ready to use!\n\n` +
        `**Note:** These are shown in the chatbot only. Your main page remains unchanged to save costs.`
      );
      
      // Clear preview data and hide after 5 seconds
      setTimeout(() => {
        setPreviewData(null);
        hideChatbot();
        setTimeout(() => setCurrentMessage(''), 100);
      }, 5000);
      
    } else if (action === 'reject') {
      setCurrentMessage("❌ Got it! Your current recommendations stay the same. No changes were made.");
      
      // Clear preview data and hide after 2 seconds
      setTimeout(() => {
        setPreviewData(null);
        hideChatbot();
        setTimeout(() => setCurrentMessage(''), 100);
      }, 2000);
      
    } else if (action === 'suggest') {
      // Generate new alternatives
      suggestMoreAlternatives();
      
    } else if (action === 'viewNew') {
      // Show the new recommendations that are now active on the main page
      if (previewData?.isMainPageUpdated) {
        setCurrentMessage(
          `🎯 **Your Updated Main Page Recommendations**\n\n` +
          `**These recommendations are now active on the main page:**\n\n` +
          `**Food Recommendations:**\n${currentRecs.currentRecommendations.filter(rec => rec.category === 'food').map((rec, index) => 
            `${index + 1}. **${rec.title || 'Food Item'}**\n   ${rec.specificAction || 'Action'}\n`
          ).join('\n')}\n\n` +
          `**Movement Recommendations:**\n${currentRecs.currentRecommendations.filter(rec => rec.category === 'movement').map((rec, index) => 
            `${index + 1}. **${rec.title || 'Movement Item'}**\n   ${rec.specificAction || 'Action'}\n`
          ).join('\n')}\n\n` +
          `**Mindfulness Recommendations:**\n${currentRecs.currentRecommendations.filter(rec => rec.category === 'mindfulness').map((rec, index) => 
            `${index + 1}. **${rec.title || 'Mindfulness Item'}**\n   ${rec.specificAction || 'Action'}\n`
          ).join('\n')}\n\n` +
          `💡 **Your main page has been updated with these personalized recommendations!**\n\n` +
          `**Options:**\n` +
          `🔄 **Generate Different Options** - Get alternative suggestions\n` +
          `✅ **Perfect!** - Keep these recommendations\n` +
          `❌ **Revert Changes** - Go back to previous recommendations`
        );
      } else {
        setCurrentMessage("⚠️ No updated recommendations found. Please try submitting your preferences again.");
      }
    }
  };

  const renderPersonalizationOptionsFlow = () => {

    if (showInputs) {
      return (
        <div className={styles.flowContainer}>
          <div className={styles.botMessage}>
            <strong>Please provide your preferences:</strong>
          </div>
          
          {selectedOptions.includes('Location') && (
            <div className={styles.inputGroup}>
              <label>📍 City, State (e.g., Fremont, CA):</label>
              <input
                type="text"
                placeholder="Enter your city and state"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={styles.textInput}
              />
              <div className={styles.locationOptions}>
                <button 
                  type="button"
                  className={styles.locationButton}
                  onClick={() => {
                    console.log('📍 Use Current Location button clicked!');
                    requestLocationAccess();
                  }}
                >
                  📍 Use My Current Location
                </button>
                <button 
                  type="button"
                  className={styles.locationButton}
                  onClick={() => {
                    console.log('🔍 Find Shops button clicked!');
                    findShopsForManualLocation();
                  }}
                  disabled={!location.trim()}
                >
                  🔍 Find Shops for My Location
                </button>
                <small className={styles.locationNote}>
                  Enter your city/state above, then click &quot;Find Shops&quot;
                </small>
              </div>
            </div>
          )}
          
          {selectedOptions.includes('Weather') && (
            <div className={styles.inputGroup}>
              <label>🌤️ What&apos;s your typical weather?</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className={styles.selectInput}
              >
                <option value="">Select your typical weather</option>
                <option value="Hot and humid">🔥 Hot and humid</option>
                <option value="Hot and dry">☀️ Hot and dry</option>
                <option value="Warm and moderate">🌤️ Warm and moderate</option>
                <option value="Cool and pleasant">🍃 Cool and pleasant</option>
                <option value="Cold and dry">❄️ Cold and dry</option>
                <option value="Cold and wet">🌧️ Cold and wet</option>
                <option value="Variable/Seasonal">🌦️ Variable/Seasonal</option>
              </select>
            </div>
          )}
          
          {selectedOptions.includes('Culture/ethnicity') && (
            <div className={styles.inputGroup}>
              <label>🌍 What&apos;s your cultural background?</label>
              <select
                value={culture}
                onChange={(e) => setCulture(e.target.value)}
                className={styles.selectInput}
              >
                <option value="">Select your culture/ethnicity</option>
                <option value="South Asian">South Asian</option>
                <option value="East Asian">East Asian</option>
                <option value="Middle Eastern">Middle Eastern</option>
                <option value="Mediterranean">Mediterranean (Italian, Greek, Turkish)</option>
                <option value="Western/American/European">Western / American / European</option>
                <option value="Other">Other (tell us)</option>
              </select>
              {culture === 'Other' && (
                <input
                  type="text"
                  placeholder="Please specify your culture/ethnicity"
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                  className={styles.textInput}
                />
              )}
            </div>
          )}
          
          <div className={styles.buttonGroup}>
            <button 
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={selectedOptions.length === 0}
            >
              ✅ Submit Preferences
            </button>
            <button 
              className={styles.backButton}
              onClick={() => {
                console.log('🔙 Back button clicked!');
                setShowInputs(false);
              }}
            >
              🔙 Back to Options
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.flowContainer}>
        <div className={styles.botMessage}>
          <strong>Would you like me to personalize based on your (multiple select):</strong>
        </div>
        <div className={styles.optionsGrid}>
          <div 
            className={`${styles.optionCard} ${selectedOptions.includes('Location') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedOptions.includes('Location')) {
                setSelectedOptions(selectedOptions.filter(opt => opt !== 'Location'));
              } else {
                setSelectedOptions([...selectedOptions, 'Location']);
              }
            }}
          >
            <div className={styles.optionIcon}>📍</div>
            <div className={styles.optionText}>Location</div>
            {selectedOptions.includes('Location') && <div className={styles.checkmark}>✓</div>}
          </div>
          
          <div 
            className={`${styles.optionCard} ${selectedOptions.includes('Weather') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedOptions.includes('Weather')) {
                setSelectedOptions(selectedOptions.filter(opt => opt !== 'Weather'));
              } else {
                setSelectedOptions([...selectedOptions, 'Weather']);
              }
            }}
          >
            <div className={styles.optionIcon}>🌤️</div>
            <div className={styles.optionText}>Weather</div>
            {selectedOptions.includes('Weather') && <div className={styles.checkmark}>✓</div>}
          </div>
          
          <div 
            className={`${styles.optionCard} ${selectedOptions.includes('Culture/ethnicity') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedOptions.includes('Culture/ethnicity')) {
                setSelectedOptions(selectedOptions.filter(opt => opt !== 'Culture/ethnicity'));
              } else {
                setSelectedOptions([...selectedOptions, 'Culture/ethnicity']);
              }
            }}
          >
            <div className={styles.optionIcon}>🌍</div>
            <div className={styles.optionText}>Culture/ethnicity</div>
            {selectedOptions.includes('Culture/ethnicity') && <div className={styles.checkmark}>✓</div>}
          </div>
          
          <div 
            className={`${styles.optionCard} ${selectedOptions.includes('Other') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedOptions.includes('Other')) {
                setSelectedOptions(selectedOptions.filter(opt => opt !== 'Other'));
              } else {
                setSelectedOptions([...selectedOptions, 'Other']);
              }
            }}
          >
            <div className={styles.optionIcon}>📝</div>
            <div className={styles.optionText}>Other</div>
            {selectedOptions.includes('Other') && <div className={styles.checkmark}>✓</div>}
          </div>
        </div>
        
        <div className={styles.nextStepButton}>
          <button 
            className={styles.nextButton}
            onClick={() => setShowInputs(true)}
            disabled={selectedOptions.length === 0}
          >
            🚀 Next Step: Provide Details
          </button>
        </div>
      </div>
    );
  };

  const renderTasteFoodItemSelectionFlow = () => {
    // Debug: Log recommendations to see what we're working with
    console.log('🎯 Chatbot received recommendations for taste preferences:', currentRecommendations);
    
    // Filter to show ONLY FOOD recommendations
    const foodRecommendations = currentRecommendations?.filter(rec => rec.category === 'food') || [];
    
    console.log('🍽️ Filtered food recommendations for taste:', foodRecommendations);
    
    if (foodRecommendations.length === 0) {
      return (
        <div className={styles.flowContainer}>
          <div className={styles.botMessage}>
            <strong>🍽️ No food recommendations found on the page yet.</strong>
            <br />
            Please wait for recommendations to load, then I can help you personalize based on your taste preferences!
          </div>
          <div className={styles.buttonGroup}>
            <button 
              className={styles.backButton}
              onClick={() => dispatch({ type: 'SET_FLOW', flow: 'feedback-reason' })}
            >
              🔙 Back to Feedback Reasons
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.flowContainer}>
        <div className={styles.botMessage}>
          <strong>🍽️ Which food recommendation are you referring to?</strong>
          <br />
          <small>Select the item you don't enjoy so I can personalize alternatives for you.</small>
        </div>
        
        <div className={styles.optionsGrid}>
          {foodRecommendations.map((rec, index) => (
            <div 
              key={index}
              className={`${styles.optionCard} ${state.tasteFeedback.selectedFoodItem === (rec.title || rec.specificAction || `Food Item ${index + 1}`) ? styles.selected : ''}`}
              onClick={() => {
                const foodItem = rec.title || rec.specificAction || `Food Item ${index + 1}`;
                console.log('🍽️ User selected food item for taste preferences:', foodItem);
                dispatch({ type: 'SELECT_TASTE_FOOD_ITEM', foodItem });
                dispatch({ type: 'SET_FLOW', flow: 'taste-personalization-options' });
              }}
            >
              <div className={styles.optionIcon}>🍽️</div>
              <div className={styles.optionText}>
                {rec.title || rec.specificAction || `Food Item ${index + 1}`}
              </div>
              {state.tasteFeedback.selectedFoodItem === (rec.title || rec.specificAction || `Food Item ${index + 1}`) && <div className={styles.checkmark}>✓</div>}
            </div>
          ))}
          
          <div 
            className={`${styles.optionCard} ${state.tasteFeedback.selectedFoodItem === 'Other' ? styles.selected : ''}`}
            onClick={() => {
              console.log('🍽️ User selected "Other" for taste preferences');
              dispatch({ type: 'SELECT_TASTE_FOOD_ITEM', foodItem: 'Other' });
              dispatch({ type: 'SET_FLOW', flow: 'taste-personalization-options' });
            }}
          >
            <div className={styles.optionIcon}>📝</div>
            <div className={styles.optionText}>Other (not listed above)</div>
            {state.tasteFeedback.selectedFoodItem === 'Other' && <div className={styles.checkmark}>✓</div>}
          </div>
        </div>
        
        <div className={styles.buttonGroup}>
          <button 
            className={styles.backButton}
            onClick={() => dispatch({ type: 'SET_FLOW', flow: 'feedback-reason' })}
          >
            🔙 Back to Feedback Reasons
          </button>
        </div>
      </div>
    );
  };

    const renderTastePersonalizationOptionsFlow = () => {
    if (showTasteInputs) {
      return (
        <div className={styles.flowContainer}>
          <div className={styles.botMessage}>
            <strong>Please provide your preferences:</strong>
          </div>
          
          {selectedTasteOptions.includes('Preferred cuisine') && (
            <div className={styles.inputGroup}>
              <label>🍽️ What's your preferred cuisine style?</label>
              <select
                value={state.tasteFeedback.preferredCuisine}
                onChange={(e) => dispatch({ type: 'SET_PREFERRED_CUISINE', cuisine: e.target.value })}
                className={styles.selectInput}
              >
                <option value="">Select your preferred cuisine</option>
                <option value="Italian">Italian</option>
                <option value="Mexican">Mexican</option>
                <option value="Indian">Indian</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Thai">Thai</option>
                <option value="Mediterranean">Mediterranean</option>
                <option value="American">American</option>
                <option value="French">French</option>
                <option value="Other">Other</option>
              </select>
              {state.tasteFeedback.preferredCuisine === 'Other' && (
                <input
                  type="text"
                  placeholder="Please specify your preferred cuisine"
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                  className={styles.textInput}
                />
              )}
            </div>
          )}
          
          {selectedOptions.includes('Culture/ethnicity') && (
            <div className={styles.inputGroup}>
              <label>🌍 What's your cultural background?</label>
              <select
                value={state.tasteFeedback.cultureEthnicity}
                onChange={(e) => dispatch({ type: 'SET_TASTE_CULTURE_ETHNICITY', ethnicity: e.target.value })}
                className={styles.selectInput}
              >
                <option value="">Select your culture/ethnicity</option>
                <option value="South Asian">South Asian</option>
                <option value="East Asian">East Asian</option>
                <option value="Middle Eastern">Middle Eastern</option>
                <option value="Mediterranean">Mediterranean (Italian, Greek, Turkish)</option>
                <option value="Western/American/European">Western / American / European</option>
                <option value="Other">Other (tell us)</option>
              </select>
              {state.tasteFeedback.cultureEthnicity === 'Other' && (
                <input
                  type="text"
                  placeholder="Please specify your culture/ethnicity"
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                  className={styles.textInput}
                />
              )}
            </div>
          )}
          
          {selectedTasteOptions.includes('Food allergies') && (
            <div className={styles.inputGroup}>
              <label>🚫 What are you allergic to?</label>
              <div className={styles.checkboxOptions}>
                {['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy', 'Fish', 'Wheat'].map((allergy) => (
                  <div 
                    key={allergy} 
                    className={`${styles.checkboxOption} ${state.tasteFeedback.foodAllergies.includes(allergy) ? styles.selected : ''}`}
                    onClick={() => {
                      if (state.tasteFeedback.foodAllergies.includes(allergy)) {
                        dispatch({ type: 'SET_TASTE_FOOD_ALLERGIES', allergies: state.tasteFeedback.foodAllergies.filter(a => a !== allergy) });
                      } else {
                        dispatch({ type: 'SET_TASTE_FOOD_ALLERGIES', allergies: [...state.tasteFeedback.foodAllergies, allergy] });
                      }
                    }}
                  >
                    {allergy}
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Other allergies (comma separated)"
                value={state.tasteFeedback.foodAllergies.filter(a => !['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy', 'Fish', 'Wheat'].includes(a)).join(', ')}
                onChange={(e) => {
                  const otherAllergies = e.target.value.split(',').map(a => a.trim()).filter(a => a);
                  const commonAllergies = state.tasteFeedback.foodAllergies.filter(a => ['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy', 'Fish', 'Wheat'].includes(a));
                  dispatch({ type: 'SET_TASTE_FOOD_ALLERGIES', allergies: [...commonAllergies, ...otherAllergies] });
                }}
                className={styles.textInput}
              />
            </div>
          )}
          
          {selectedTasteOptions.includes('Diet restrictions') && (
            <div className={styles.inputGroup}>
              <label>🥗 What are your diet restrictions?</label>
              <div className={styles.checkboxOptions}>
                {['Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Low-carb', 'Low-sodium', 'Low-sugar', 'Halal', 'Kosher'].map((diet) => (
                  <div 
                    key={diet} 
                    className={`${styles.optionCard} ${state.tasteFeedback.dietRestrictions.includes(diet) ? styles.selected : ''}`}
                    onClick={() => {
                      if (state.tasteFeedback.dietRestrictions.includes(diet)) {
                        dispatch({ type: 'SET_TASTE_DIET_RESTRICTIONS', restrictions: state.tasteFeedback.dietRestrictions.filter(d => d !== diet) });
                      } else {
                        dispatch({ type: 'SET_TASTE_DIET_RESTRICTIONS', restrictions: [...state.tasteFeedback.dietRestrictions, diet] });
                      }
                    }}
                  >
                    {diet}
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Other diet restrictions (comma separated)"
                value={state.tasteFeedback.dietRestrictions.filter(d => !['Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Low-carb', 'Low-sodium', 'Low-sugar', 'Halal', 'Kosher'].includes(d)).join(', ')}
                onChange={(e) => {
                  const otherDiets = e.target.value.split(',').map(d => d.trim()).filter(d => d);
                  const commonDiets = state.tasteFeedback.dietRestrictions.filter(d => ['Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Low-carb', 'Low-sodium', 'Low-sugar', 'Halal', 'Kosher'].includes(d));
                  dispatch({ type: 'SET_TASTE_DIET_RESTRICTIONS', restrictions: [...commonDiets, ...otherDiets] });
              }}
                className={styles.textInput}
              />
            </div>
          )}
          
          {selectedTasteOptions.includes('Other') && (
            <div className={styles.inputGroup}>
              <label>📝 Any other taste preferences or restrictions?</label>
              <textarea
                placeholder="Tell me anything else about your taste preferences..."
                value={state.tasteFeedback.otherPreferences}
                onChange={(e) => dispatch({ type: 'SET_TASTE_OTHER_PREFERENCES', preferences: e.target.value })}
                className={styles.textInput}
                rows={3}
              />
            </div>
          )}
          
          <div className={styles.buttonGroup}>
            <button 
              className={styles.submitButton}
              onClick={handleTasteSubmit}
              disabled={selectedTasteOptions.length === 0}
            >
              ✅ Submit Taste Preferences
            </button>
            <button 
              className={styles.backButton}
              onClick={() => setShowTasteInputs(false)}
            >
              🔙 Back to Options
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.flowContainer}>
        <div className={styles.botMessage}>
          <strong>Would you like me to personalize based on your:</strong>
        </div>
        <div className={styles.optionsGrid}>
          <div 
            className={`${styles.optionCard} ${selectedTasteOptions.includes('Preferred cuisine') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedTasteOptions.includes('Preferred cuisine')) {
                setSelectedTasteOptions(selectedTasteOptions.filter(opt => opt !== 'Preferred cuisine'));
              } else {
                setSelectedTasteOptions([...selectedTasteOptions, 'Preferred cuisine']);
              }
            }}
          >
            <div className={styles.optionIcon}>🍽️</div>
            <div className={styles.optionText}>Preferred cuisine</div>
            {selectedTasteOptions.includes('Preferred cuisine') && <div className={styles.checkmark}>✓</div>}
          </div>
          
          <div 
            className={`${styles.optionCard} ${selectedTasteOptions.includes('Culture/ethnicity') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedTasteOptions.includes('Culture/ethnicity')) {
                setSelectedTasteOptions(selectedTasteOptions.filter(opt => opt !== 'Culture/ethnicity'));
              } else {
                setSelectedTasteOptions([...selectedTasteOptions, 'Culture/ethnicity']);
              }
            }}
          >
            <div className={styles.optionIcon}>🌍</div>
            <div className={styles.optionText}>Culture/ethnicity</div>
            {selectedOptions.includes('Culture/ethnicity') && <div className={styles.checkmark}>✓</div>}
          </div>
          
          <div 
            className={`${styles.optionCard} ${selectedTasteOptions.includes('Food allergies') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedTasteOptions.includes('Food allergies')) {
                setSelectedTasteOptions(selectedTasteOptions.filter(opt => opt !== 'Food allergies'));
              } else {
                setSelectedTasteOptions([...selectedTasteOptions, 'Food allergies']);
              }
            }}
          >
            <div className={styles.optionIcon}>🚫</div>
            <div className={styles.optionText}>Food allergies</div>
            {selectedTasteOptions.includes('Food allergies') && <div className={styles.checkmark}>✓</div>}
          </div>
          
          <div 
            className={`${styles.optionCard} ${selectedTasteOptions.includes('Diet restrictions') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedTasteOptions.includes('Diet restrictions')) {
                setSelectedTasteOptions(selectedTasteOptions.filter(opt => opt !== 'Diet restrictions'));
              } else {
                setSelectedTasteOptions([...selectedTasteOptions, 'Diet restrictions']);
              }
            }}
          >
            <div className={styles.optionIcon}>🥗</div>
            <div className={styles.optionText}>Diet restrictions</div>
            {selectedTasteOptions.includes('Diet restrictions') && <div className={styles.checkmark}>✓</div>}
          </div>
          
          <div 
            className={`${styles.optionCard} ${selectedTasteOptions.includes('Other') ? styles.selected : ''}`}
            onClick={() => {
              if (selectedTasteOptions.includes('Other')) {
                setSelectedTasteOptions(selectedTasteOptions.filter(opt => opt !== 'Other'));
              } else {
                setSelectedTasteOptions([...selectedTasteOptions, 'Other']);
              }
            }}
          >
            <div className={styles.optionIcon}>📝</div>
            <div className={styles.optionText}>Other</div>
            {selectedTasteOptions.includes('Other') && <div className={styles.checkmark}>✓</div>}
          </div>
        </div>
        
        <div className={styles.nextStepButton}>
          <button 
            className={styles.nextButton}
            onClick={() => setShowTasteInputs(true)}
            disabled={selectedTasteOptions.length === 0}
          >
            🚀 Next Step: Provide Details
          </button>
        </div>
      </div>
    );
  };

  const handleTasteSubmit = () => {
    console.log('🚀 Taste submit button clicked!');
    console.log('📊 Current taste state:', {
      selectedFoodItem: state.tasteFeedback.selectedFoodItem,
      preferredCuisine: state.tasteFeedback.preferredCuisine,
      cultureEthnicity: state.tasteFeedback.cultureEthnicity,
      foodAllergies: state.tasteFeedback.foodAllergies,
      dietRestrictions: state.tasteFeedback.dietRestrictions,
      otherPreferences: state.tasteFeedback.otherPreferences
    });
    
    const preferences = [];
    
    if (state.tasteFeedback.preferredCuisine) {
      preferences.push(`Preferred cuisine: ${state.tasteFeedback.preferredCuisine}`);
    }
    if (state.tasteFeedback.cultureEthnicity) {
      preferences.push(`Culture/Ethnicity: ${state.tasteFeedback.cultureEthnicity}`);
    }
    if (state.tasteFeedback.foodAllergies.length > 0) {
      preferences.push(`Food allergies: ${state.tasteFeedback.foodAllergies.join(', ')}`);
    }
    if (state.tasteFeedback.dietRestrictions.length > 0) {
      preferences.push(`Diet restrictions: ${state.tasteFeedback.dietRestrictions.join(', ')}`);
    }
    if (state.tasteFeedback.otherPreferences) {
      preferences.push(`Other preferences: ${state.tasteFeedback.otherPreferences}`);
    }
    
    console.log('🎯 Taste preferences to submit:', preferences);
    
    if (preferences.length === 0) {
      console.log('❌ No taste preferences to submit, showing error');
      setCurrentMessage("⚠️ Please fill in at least one field before submitting.");
      return;
    }
    
    // Store preferences in chatbot state
    dispatch({ type: 'SET_PERSONALIZATION_PREFERENCES', preferences });
    
    setCurrentMessage("🎯 Personalizing according to your taste preferences... Generating delicious alternatives for you! ✨");
    
    // Show the message for 2 seconds, then hide chatbot
    setTimeout(() => {
      hideChatbot();
      // Clear the message after hiding
      setTimeout(() => setCurrentMessage(''), 100);
    }, 2000);
  };

  const renderCurrentFlow = () => {
    console.log('🎭 Rendering flow:', state.currentFlow);
    switch (state.currentFlow) {
      case 'feedback':
        return renderFeedbackFlow();
      case 'feedback-reason':
        return renderFeedbackReasonFlow();
      case 'select-food-item':
        return renderFoodItemSelectionFlow();
      case 'personalization-options':
        return renderPersonalizationOptionsFlow();
      case 'select-restriction-food-item':
        return renderRestrictionFoodItemSelectionFlow();
      case 'restriction-personalization-options':
        return renderRestrictionPersonalizationOptionsFlow();
      case 'select-taste-food-item':
        return renderTasteFoodItemSelectionFlow();
      case 'taste-personalization-options':
        return renderTastePersonalizationOptionsFlow();
      case 'select-too-hard-item':
        return renderTooHardItemSelectionFlow();
      case 'too-hard-personalization-options':
        return renderTooHardPersonalizationOptionsFlow();
      default:
        console.log('❌ No flow set, returning null');
        return null;
    }
  };

  const renderTooHardItemSelectionFlow = () => {
    // Debug: Log recommendations to see what we're working with
    console.log('🎯 Chatbot received recommendations for too-hard feedback:', currentRecommendations);
    
    // Show ALL recommendations (not just food)
    const allRecommendations = currentRecommendations || [];
    
    console.log('🏋️ All recommendations for too-hard feedback:', allRecommendations);
    
    if (allRecommendations.length === 0) {
      return (
        <div className={styles.flowContainer}>
          <div className={styles.botMessage}>
            <strong>🏋️ No recommendations found on the page yet.</strong>
            <br />
            Please wait for recommendations to load, then I can help you find easier alternatives!
          </div>
          <div className={styles.buttonGroup}>
            <button 
              className={styles.backButton}
              onClick={() => dispatch({ type: 'SET_FLOW', flow: 'feedback-reason' })}
            >
              🔙 Back to Feedback Reasons
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.flowContainer}>
        <div className={styles.botMessage}>
          <strong>🏋️ Which recommendation feels too hard for you?</strong>
          <br />
          <small>Select the item that requires more time or effort than you can give, and I'll suggest easier alternatives.</small>
        </div>
        
        <div className={styles.optionsGrid}>
          {allRecommendations.map((rec, index) => (
            <div 
              key={index}
              className={`${styles.optionCard} ${state.tooHardFeedback.selectedItem === (rec.title || rec.specificAction || `${rec.category || 'Item'} ${index + 1}`) ? styles.selected : ''}`}
              onClick={() => {
                const item = rec.title || rec.specificAction || `${rec.category || 'Item'} ${index + 1}`;
                console.log('🏋️ User selected item for too-hard feedback:', item);
                dispatch({ type: 'SELECT_TOO_HARD_ITEM', item });
                dispatch({ type: 'SET_FLOW', flow: 'too-hard-personalization-options' });
              }}
            >
              <div className={styles.optionIcon}>
                {rec.category === 'food' ? '🍽️' : rec.category === 'movement' ? '🏃‍♀️' : '🧘‍♀️'}
              </div>
              <div className={styles.optionText}>
                {rec.title || rec.specificAction || `${rec.category || 'Item'} ${index + 1}`}
              </div>
              {state.tooHardFeedback.selectedItem === (rec.title || rec.specificAction || `${rec.category || 'Item'} ${index + 1}`) && <div className={styles.checkmark}>✓</div>}
            </div>
          ))}
          
          <div 
            className={`${styles.optionCard} ${state.tooHardFeedback.selectedItem === 'Other' ? styles.selected : ''}`}
            onClick={() => {
              console.log('🏋️ User selected "Other" for too-hard feedback');
              dispatch({ type: 'SELECT_TOO_HARD_ITEM', item: 'Other' });
              dispatch({ type: 'SET_FLOW', flow: 'too-hard-personalization-options' });
            }}
          >
            <div className={styles.optionIcon}>📝</div>
            <div className={styles.optionText}>Other (not listed above)</div>
            {state.tooHardFeedback.selectedItem === 'Other' && <div className={styles.checkmark}>✓</div>}
          </div>
        </div>
        
        <div className={styles.buttonGroup}>
          <button 
            className={styles.backButton}
            onClick={() => dispatch({ type: 'SET_FLOW', flow: 'feedback-reason' })}
          >
            🔙 Back to Feedback Reasons
          </button>
        </div>
      </div>
    );
  };

  const renderTooHardPersonalizationOptionsFlow = () => {
    return (
      <div className={styles.flowContainer}>
        <div className={styles.botMessage}>
          <strong>⏰ Let&apos;s find easier alternatives that fit your schedule!</strong>
          <br />
          <small>I&apos;ll personalize recommendations based on your time and energy levels.</small>
        </div>
        
        <div className={styles.inputGroup}>
          <label>⏰ How much time per day would you like to invest in your wellbeing?</label>
          <select
            value={state.tooHardFeedback.timePerDay}
            onChange={(e) => dispatch({ type: 'SET_TIME_PER_DAY', time: e.target.value })}
            className={styles.selectInput}
          >
            <option value="">Select your preferred time investment</option>
            <option value="5-10 minutes">5-10 minutes</option>
            <option value="15-20 minutes">15-20 minutes</option>
            <option value="30 minutes">30 minutes</option>
            <option value="45 minutes">45 minutes</option>
            <option value="1 hour">1 hour</option>
            <option value="More than 1 hour">More than 1 hour</option>
          </select>
        </div>
        
        <div className={styles.inputGroup}>
          <label>🎯 How many actions would you like to take each day?</label>
          <select
            value={state.tooHardFeedback.dailyActions}
            onChange={(e) => dispatch({ type: 'SET_DAILY_ACTIONS', actions: e.target.value })}
            className={styles.selectInput}
          >
            <option value="">Select your preferred daily action count</option>
            <option value="1 action">1 action</option>
            <option value="2 actions">2 actions</option>
            <option value="3 actions">3 actions</option>
          </select>
        </div>
        
        <div className={styles.inputGroup}>
          <label>🚀 What is easiest to get started with?</label>
          <div className={styles.optionsGrid}>
            <div 
              className={`${styles.optionCard} ${state.tooHardFeedback.easiestToStart === 'food' ? styles.selected : ''}`}
              onClick={() => dispatch({ type: 'SET_EASIEST_TO_START', category: 'food' })}
            >
              <div className={styles.optionIcon}>🍽️</div>
              <div className={styles.optionText}>Food</div>
              {state.tooHardFeedback.easiestToStart === 'food' && <div className={styles.checkmark}>✓</div>}
            </div>
            
            <div 
              className={`${styles.optionCard} ${state.tooHardFeedback.easiestToStart === 'move' ? styles.selected : ''}`}
              onClick={() => dispatch({ type: 'SET_EASIEST_TO_START', category: 'move' })}
            >
              <div className={styles.optionIcon}>🏃‍♀️</div>
              <div className={styles.optionText}>Move</div>
              {state.tooHardFeedback.easiestToStart === 'move' && <div className={styles.checkmark}>✓</div>}
            </div>
            
            <div 
              className={`${styles.optionCard} ${state.tooHardFeedback.easiestToStart === 'emotions' ? styles.selected : ''}`}
              onClick={() => dispatch({ type: 'SET_EASIEST_TO_START', category: 'emotions' })}
            >
              <div className={styles.optionIcon}>🧘‍♀️</div>
              <div className={styles.optionText}>Emotions</div>
              {state.tooHardFeedback.easiestToStart === 'emotions' && <div className={styles.checkmark}>✓</div>}
            </div>
          </div>
        </div>
        
        <div className={styles.buttonGroup}>
          <button 
            className={styles.submitButton}
            onClick={handleTooHardSubmit}
            disabled={!state.tooHardFeedback.timePerDay || !state.tooHardFeedback.dailyActions || !state.tooHardFeedback.easiestToStart}
          >
            ✅ Get Easier Alternatives
          </button>
          <button 
            className={styles.backButton}
            onClick={() => dispatch({ type: 'SET_FLOW', flow: 'select-too-hard-item' })}
          >
            🔙 Back to Item Selection
          </button>
        </div>
      </div>
    );
  };

  const handleTooHardSubmit = () => {
    console.log('🚀 Too-hard submit button clicked!');
    console.log('📊 Current too-hard state:', {
      selectedItem: state.tooHardFeedback.selectedItem,
      timePerDay: state.tooHardFeedback.timePerDay,
      dailyActions: state.tooHardFeedback.dailyActions,
      easiestToStart: state.tooHardFeedback.easiestToStart
    });
    
    const preferences = [];
    
    if (state.tooHardFeedback.timePerDay) {
      preferences.push(`Time per day: ${state.tooHardFeedback.timePerDay}`);
    }
    if (state.tooHardFeedback.dailyActions) {
      preferences.push(`Daily actions: ${state.tooHardFeedback.dailyActions}`);
    }
    if (state.tooHardFeedback.easiestToStart) {
      preferences.push(`Easiest to start: ${state.tooHardFeedback.easiestToStart}`);
    }
    
    console.log('🎯 Too-hard preferences to submit:', preferences);
    
    if (preferences.length === 0) {
      console.log('❌ No too-hard preferences to submit, showing error');
      setCurrentMessage("⚠️ Please fill in all fields before submitting.");
      return;
    }
    
    // Store preferences in chatbot state
    dispatch({ type: 'SET_PERSONALIZATION_PREFERENCES', preferences });
    
    // Trigger recommendation refresh with the selected category
    if (state.tooHardFeedback.easiestToStart) {
      const category = state.tooHardFeedback.easiestToStart;
      console.log('🎯 Triggering recommendation refresh for category:', category);
      
      // Map the category to a more descriptive reason
      let reason = '';
      if (category === 'food') reason = 'User prefers food-based recommendations';
      else if (category === 'move') reason = 'User prefers movement-based recommendations';
      else if (category === 'emotions') reason = 'User prefers mindfulness/emotion-based recommendations';
      
      dispatch({ 
        type: 'TRIGGER_RECOMMENDATION_REFRESH', 
        reason: reason,
        preferences: preferences
      });
      
      setCurrentMessage(`🎯 Perfect! I'll show you only ${category === 'food' ? '🍽️ food' : category === 'move' ? '🏃‍♀️ movement' : '🧘‍♀️ mindfulness'} recommendations that fit your ${state.tooHardFeedback.timePerDay} daily time and ${state.tooHardFeedback.dailyActions} daily actions. Refreshing your recommendations now... ✨`);
    } else {
      setCurrentMessage("🎯 Personalizing according to your time and energy levels... Generating easier alternatives that fit your schedule! ✨");
    }
    
    // Show the message for 3 seconds, then hide chatbot
    setTimeout(() => {
      hideChatbot();
      // Clear the message after hiding
      setTimeout(() => setCurrentMessage(''), 100);
    }, 3000);
  };

  return (
    <div className={styles.chatbotOverlay}>
      <div className={styles.chatbotContainer}>
        <div className={styles.chatbotHeader}>
          <div className={styles.botAvatar}>
            <img src="/Auvra.svg" alt="Auvra Logo" className={styles.auvraLogo} />
          </div>
          <div className={styles.botInfo}>
            <div className={styles.botName}>Auvra - your personal Hormone Guide</div>
            <div className={styles.botStatus}>I&apos;m here to help you feel more in control of your body</div>
          </div>
          <button className={styles.closeButton} onClick={hideChatbot}>
            ×
          </button>
        </div>
        
        <div className={styles.chatbotBody}>
          {renderCurrentFlow()}
        </div>
      </div>
    </div>
  );
};

export default Chatbot; 