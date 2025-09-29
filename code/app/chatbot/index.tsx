import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Polyfill for crypto.randomUUID
if (typeof crypto.randomUUID !== 'function') {
  // @ts-ignore - The types are slightly different but functionally compatible
  crypto.randomUUID = uuidv4;
}

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
  Dimensions,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, MessageSquare, Sparkles, History } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { processChatMessage, getChatHistory, getOrCreateConversation, createNewConversation, saveMessage, getAllConversations } from '@/lib/chatService';
import { getAllMonasteries } from '@/lib/monasteryService';
import { createBooking, BookingInsert } from '@/lib/bookingService';
import { useAuth } from '@/contexts/AuthContext';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import SafeScreen from '@/components/SafeScreen';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export default function Chatbot() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "**Welcome to Monastery360!** 🙏\n\nI'm your guide to Sikkim's Buddhist monasteries. I can help you:\n\n• Learn about monastery history and significance\n• Plan visits and get practical information\n• Explore Buddhist culture and traditions\n• Book monastery visits\n\nWhat would you like to know about Sikkim's sacred heritage?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Booking flow state
  const [isInBookingFlow, setIsInBookingFlow] = useState(false);
  const [bookingStep, setBookingStep] = useState('');
  const [bookingData, setBookingData] = useState({
    monasteryId: '',
    monasteryName: '',
    email: '',
    phone: '',
    numberOfPeople: '',
    visitDate: '',
    specialRequests: ''
  });

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const startNewChat = async () => {
      if (user) {
        // Always create a new conversation when chatbot opens
        const newConvId = await createNewConversation();
        if (newConvId) {
          setConversationId(newConvId);
          // Start with fresh welcome message
          setMessages([
            {
              id: '1',
              text: "**Welcome to Monastery360!** 🙏\n\nI'm your guide to Sikkim's Buddhist monasteries. I can help you:\n\n• Learn about monastery history and significance\n• Plan visits and get practical information\n• Explore Buddhist culture and traditions\n• Book monastery visits\n\nWhat would you like to know about Sikkim's sacred heritage?",
              isUser: false,
              timestamp: new Date(),
            }
          ]);
        }
      }
    };
    startNewChat();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    setIsLoadingConversations(true);
    try {
      const allConversations = await getAllConversations();
      setConversations(allConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleSelectConversation = async (selectedConversationId: string) => {
    setConversationId(selectedConversationId);
    const history = await getChatHistory(selectedConversationId);
    setMessages(history.length > 0 ? history : [
      {
        id: '1',
        text: "🙏 Welcome back! How can I help you explore Sikkim's monasteries today?",
        isUser: false,
        timestamp: new Date(),
      }
    ]);
    setIsSidebarVisible(false);
  };

  const handleNewChat = async () => {
    const newConvId = await createNewConversation();
    setConversationId(newConvId);
    setMessages([
      {
        id: '1',
        text: "**Welcome to Monastery360!** 🙏\n\nI'm your guide to Sikkim's Buddhist monasteries. I can help you:\n\n• Learn about monastery history and significance\n• Plan visits and get practical information\n• Explore Buddhist culture and traditions\n• Book monastery visits\n\nWhat would you like to know about Sikkim's sacred heritage?",
        isUser: false,
        timestamp: new Date(),
      }
    ]);
    setIsSidebarVisible(false);

    // Reset any booking flow state
    setIsInBookingFlow(false);
    setBookingStep('');
    setBookingData({
      monasteryId: '',
      monasteryName: '',
      email: '',
      phone: '',
      numberOfPeople: '',
      visitDate: '',
      specialRequests: ''
    });
  };

  const handleOpenSidebar = () => {
    loadConversations();
    setIsSidebarVisible(true);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Check if we're in booking flow
    if (isInBookingFlow) {
      await handleBookingResponse(currentInput, userMessage);
      return;
    }

    // Check for booking intent keywords
    const bookingKeywords = ['book', 'booking', 'reserve', 'reservation', 'schedule'];
    const containsBookingKeyword = bookingKeywords.some(keyword =>
      currentInput.toLowerCase().includes(keyword)
    );

    if (containsBookingKeyword && !isInBookingFlow) {
      await initiateBookingFlow(userMessage);
      return;
    }

    // Save user message to DB
    if (conversationId) {
      await saveMessage(conversationId, userMessage);
    }

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      text: '...',
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      // Get the last two messages for context
      const lastMessages = messages.slice(-2);

      // Call our RAG + Gemini service with conversation history
      const response = await processChatMessage(userMessage.text, lastMessages);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      // Remove typing indicator and add response
      setMessages(prev => prev.filter(msg => msg.id !== 'typing').concat(botResponse));

      // Save bot response to DB
      if (conversationId) {
        await saveMessage(conversationId, botResponse);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble processing your request right now. Please try asking about specific monasteries or Buddhist culture in Sikkim!",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => prev.filter(msg => msg.id !== 'typing').concat(errorResponse));
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.botMessage
    ]}>
      {!item.isUser && (
        <View style={styles.botAvatar}>
          <MessageSquare size={16} color="#FFFFFF" />
        </View>
      )}
      <View style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.botBubble
      ]}>
        {item.isTyping ? (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color="#6B7280" />
            <Text style={styles.typingText}>Monastery360 is typing...</Text>
          </View>
        ) : item.isUser ? (
          <Text style={[styles.messageText, styles.userText]}>
            {item.text}
          </Text>
        ) : (
          <Markdown style={{
            body: {
              color: '#374151',
              fontSize: 14,
              lineHeight: 20,
            },
            heading1: {
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
              color: '#1F2937',
            },
            heading2: {
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 6,
              color: '#1F2937',
            },
            paragraph: {
              marginBottom: 8,
              color: '#374151',
            },
            strong: {
              fontWeight: '600',
            },
            em: {
              fontStyle: 'italic',
            },
            list_item: {
              marginBottom: 4,
            },
            bullet_list: {
              marginBottom: 8,
            },
            code_inline: {
              backgroundColor: '#F3F4F6',
              paddingHorizontal: 4,
              borderRadius: 3,
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            },
          }}>
            {item.text}
          </Markdown>
        )}
      </View>
    </View>
  );

  const initiateBookingFlow = async (userMessage: Message) => {
    setIsInBookingFlow(true);
    setBookingStep('single_response');

    // Save user message to DB
    if (conversationId) {
      await saveMessage(conversationId, userMessage);
    }

    const bookingPrompt = `🎫 **Great! I'll help you book a monastery visit.**

Please provide all details in **one message** using this exact format:

**📝 Format:** Monastery Name, Email, Date (DD/MM/YYYY), Number of People, Special Requirements

**📋 Example:**
\`Rumtek Monastery, john@email.com, 25/12/2024, 2, Photography permission\`

**🏛️ Popular Monasteries:**
Rumtek, Enchey, Pemayangtse, Tashiding, Dubdi, Labrang, Phensang

**⚠️ Requirements:**
• Valid email address
• Future date only
• 1-50 people maximum
• Special requirements are optional

Please send your booking details:`;

    const botMessage: Message = {
      id: Date.now().toString(),
      text: bookingPrompt,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages(prev => prev.filter(msg => msg.id !== 'typing').concat(botMessage));

    // Save bot message to DB
    if (conversationId) {
      await saveMessage(conversationId, botMessage);
    }

    setIsLoading(false);
  };

  const startBookingFlow = async () => {
    setIsInBookingFlow(true);
    setBookingStep('monastery_selection');

    // Get monasteries and show them as options
    const monasteries = await getAllMonasteries();

    const monasteryListMessage = `🏛️ **Select a Monastery for Your Visit:**

${monasteries.slice(0, 8).map((monastery, index) =>
  `${index + 1}. **${monastery.name}**\n   📍 ${monastery.location}\n   🏛️ ${monastery.era} era\n`
).join('\n')}

Please reply with the number (1-${Math.min(8, monasteries.length)}) of the monastery you'd like to visit.`;

    const botMessage: Message = {
      id: Date.now().toString(),
      text: monasteryListMessage,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const handleSingleResponseBooking = async (userInput: string, userMessage: Message) => {
    try {
      // Parse the comma-separated response
      const parts = userInput.split(',').map(part => part.trim());

      if (parts.length < 4) {
        const errorMessage = `❌ **Incomplete booking details.**

Please provide all required information in this format:
**Monastery Name, Your Email, Preferred Date (DD/MM/YYYY), Number of Visitors, Special Requirements (optional)**

Example: Rumtek Monastery, john@email.com, 25/12/2024, 2, Photography permission`;

        addBotMessage(errorMessage);
        return;
      }

      const [monasteryName, email, preferredDate, visitorsStr, specialRequirements = ''] = parts;

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        addBotMessage("❌ **Invalid email address.** Please provide a valid email format (e.g., user@email.com)");
        return;
      }

      // Validate date format
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(preferredDate)) {
        addBotMessage("❌ **Invalid date format.** Please use DD/MM/YYYY format (e.g., 25/12/2024)");
        return;
      }

      // Validate number of visitors
      const visitors = parseInt(visitorsStr);
      if (isNaN(visitors) || visitors < 1 || visitors > 50) {
        addBotMessage("❌ **Invalid number of visitors.** Please enter a number between 1 and 50");
        return;
      }

      // Find monastery by name
      const monasteries = await getAllMonasteries();
      const monastery = monasteries.find(m =>
        m.name.toLowerCase().includes(monasteryName.toLowerCase()) ||
        monasteryName.toLowerCase().includes(m.name.toLowerCase())
      );

      if (!monastery) {
        const availableMonasteries = monasteries.slice(0, 10).map(m => m.name).join(', ');
        addBotMessage(`❌ **Monastery not found.**

Available monasteries include: ${availableMonasteries}

Please try again with a valid monastery name.`);
        return;
      }

      // Parse the date
      const [day, month, year] = preferredDate.split('/');
      const visitDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      // Check if date is in the future
      if (visitDate <= new Date()) {
        addBotMessage("❌ **Invalid date.** Please select a future date for your visit.");
        return;
      }

      // Create booking data
      const bookingData: BookingInsert = {
        user_id: user?.id || '',
        monastery_id: monastery.id,
        email: email,
        phone: '', // We don't collect phone in this flow
        number_of_people: visitors,
        visit_date: visitDate.toISOString(),
        special_requests: specialRequirements || null,
        status: 'pending'
      };

      // Save to database
      const booking = await createBooking(bookingData);

      if (booking) {
        const successMessage = `✅ **Booking Confirmed!**

**Monastery:** ${monastery.name}
**Email:** ${email}
**Date:** ${preferredDate}
**Number of People:** ${visitors}
**Special Requirements:** ${specialRequirements || 'None'}

Your booking has been submitted and is pending confirmation. You'll receive an email update soon.

**Booking ID:** ${booking.id}`;

        addBotMessage(successMessage);

        // Reset booking flow
        setIsInBookingFlow(false);
        setBookingStep('');
      } else {
        addBotMessage("❌ **Booking failed.** Please try again or contact support.");
      }

    } catch (error) {
      console.error('Booking error:', error);
      addBotMessage("❌ **An error occurred while processing your booking.** Please try again.");
    }
  };

  const handleBookingResponse = async (userInput: string, userMessage: Message) => {
    try {
      const monasteries = await getAllMonasteries();

      switch (bookingStep) {
        case 'single_response':
          await handleSingleResponseBooking(userInput, userMessage);
          break;

        case 'monastery_selection':
          const selectedIndex = parseInt(userInput) - 1;
          if (selectedIndex >= 0 && selectedIndex < Math.min(8, monasteries.length)) {
            const selectedMonastery = monasteries[selectedIndex];
            setBookingData(prev => ({
              ...prev,
              monasteryId: selectedMonastery.id,
              monasteryName: selectedMonastery.name
            }));
            setBookingStep('email');

            const emailPrompt = `✅ Great! You've selected **${selectedMonastery.name}**.

📧 Please provide your email address for booking confirmation:`;

            addBotMessage(emailPrompt);
          } else {
            addBotMessage("❌ Please select a valid monastery number from the list above.");
          }
          break;

        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(userInput)) {
            setBookingData(prev => ({ ...prev, email: userInput }));
            setBookingStep('phone');
            addBotMessage("📱 Please provide your phone number:");
          } else {
            addBotMessage("❌ Please provide a valid email address.");
          }
          break;

        case 'phone':
          const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
          if (phoneRegex.test(userInput)) {
            setBookingData(prev => ({ ...prev, phone: userInput }));
            setBookingStep('people');
            addBotMessage("👥 How many people will be visiting? (1-20)");
          } else {
            addBotMessage("❌ Please provide a valid phone number.");
          }
          break;

        case 'people':
          const numberOfPeople = parseInt(userInput);
          if (numberOfPeople >= 1 && numberOfPeople <= 20) {
            setBookingData(prev => ({ ...prev, numberOfPeople: userInput }));
            setBookingStep('date');
            addBotMessage("📅 Please provide your preferred visit date (YYYY-MM-DD format):");
          } else {
            addBotMessage("❌ Please provide a valid number of people (1-20).");
          }
          break;

        case 'date':
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          const visitDate = new Date(userInput);
          const today = new Date();
          if (dateRegex.test(userInput) && visitDate > today) {
            setBookingData(prev => ({ ...prev, visitDate: userInput }));
            setBookingStep('requests');
            addBotMessage("📝 Any special requests? (Optional - type 'none' if no special requests):");
          } else {
            addBotMessage("❌ Please provide a valid future date in YYYY-MM-DD format.");
          }
          break;

        case 'requests':
          setBookingData(prev => ({ ...prev, specialRequests: userInput === 'none' ? '' : userInput }));
          setBookingStep('confirm');

          const confirmationMessage = `🎫 **Booking Summary:**

🏛️ **Monastery:** ${bookingData.monasteryName}
📧 **Email:** ${bookingData.email}
📱 **Phone:** ${bookingData.phone}
👥 **People:** ${bookingData.numberOfPeople}
📅 **Date:** ${bookingData.visitDate}
📝 **Special Requests:** ${userInput === 'none' ? 'None' : userInput}

Type **'confirm'** to book or **'cancel'** to abort:`;

          addBotMessage(confirmationMessage);
          break;

        case 'confirm':
          if (userInput.toLowerCase() === 'confirm') {
            await finalizeBooking();
          } else if (userInput.toLowerCase() === 'cancel') {
            cancelBooking();
          } else {
            addBotMessage("Please type 'confirm' to complete booking or 'cancel' to abort.");
          }
          break;
      }
    } catch (error) {
      console.error('Booking flow error:', error);
      addBotMessage("❌ Sorry, there was an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addBotMessage = (text: string) => {
    const botMessage: Message = {
      id: Date.now().toString(),
      text: text,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const finalizeBooking = async () => {
    try {
      if (!user?.id) {
        addBotMessage("❌ Please log in to complete your booking.");
        return;
      }

      const bookingRequest = {
        monastery_id: bookingData.monasteryId,
        user_id: user.id,
        email: bookingData.email,
        phone: bookingData.phone,
        number_of_people: parseInt(bookingData.numberOfPeople),
        visit_date: bookingData.visitDate,
        special_requests: bookingData.specialRequests,
        status: 'pending' as const
      };

      const result = await createBooking(bookingRequest);

      addBotMessage(`✅ **Booking Confirmed!**

Your visit to **${bookingData.monasteryName}** has been booked successfully!

📧 A confirmation email will be sent to ${bookingData.email}
📱 You'll receive SMS updates on ${bookingData.phone}
🎫 Booking ID: ${result.id}
📅 Visit Date: ${bookingData.visitDate}
🎫 Status: Pending approval

Thank you for choosing Monastery360! 🙏`);

      // Reset booking flow
      setIsInBookingFlow(false);
      setBookingStep('');
      setBookingData({
        monasteryId: '',
        monasteryName: '',
        email: '',
        phone: '',
        numberOfPeople: '',
        visitDate: '',
        specialRequests: ''
      });
    } catch (error) {
      console.error('Booking creation error:', error);
      addBotMessage("❌ Failed to create booking. Please try again later.");
    }
  };

  const cancelBooking = () => {
    setIsInBookingFlow(false);
    setBookingStep('');
    setBookingData({
      monasteryId: '',
      monasteryName: '',
      email: '',
      phone: '',
      numberOfPeople: '',
      visitDate: '',
      specialRequests: ''
    });
    addBotMessage("❌ Booking cancelled. Feel free to start again anytime! 🙏");
  };

  const handleBookingFlowMessage = async (userInput: string) => {
    const monasteries = await getAllMonasteries();

    switch (bookingStep) {
      case 'monastery_selection':
        const selectedIndex = parseInt(userInput.trim()) - 1;
        if (selectedIndex >= 0 && selectedIndex < Math.min(8, monasteries.length)) {
          const selectedMonastery = monasteries[selectedIndex];
          setBookingData(prev => ({
            ...prev,
            monasteryId: selectedMonastery.id,
            monasteryName: selectedMonastery.name
          }));
          setBookingStep('email');

          const emailMessage: Message = {
            id: Date.now().toString(),
            text: `✅ Great choice! You selected **${selectedMonastery.name}**.

📧 **Please provide your email address for the booking confirmation:**`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, emailMessage]);
        } else {
          const errorMessage: Message = {
            id: Date.now().toString(),
            text: `❌ Please select a valid number (1-${Math.min(8, monasteries.length)}).`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(userInput.trim())) {
          setBookingData(prev => ({ ...prev, email: userInput.trim() }));
          setBookingStep('phone');

          const phoneMessage: Message = {
            id: Date.now().toString(),
            text: `📧 Email saved: ${userInput.trim()}

📱 **Please provide your phone number:**`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, phoneMessage]);
        } else {
          const errorMessage: Message = {
            id: Date.now().toString(),
            text: `❌ Please provide a valid email address.`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
        break;

      case 'phone':
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (phoneRegex.test(userInput.trim())) {
          setBookingData(prev => ({ ...prev, phone: userInput.trim() }));
          setBookingStep('people');

          const peopleMessage: Message = {
            id: Date.now().toString(),
            text: `📱 Phone saved: ${userInput.trim()}

👥 **How many people will be visiting? (1-20)**`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, peopleMessage]);
        } else {
          const errorMessage: Message = {
            id: Date.now().toString(),
            text: `❌ Please provide a valid phone number.`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
        break;

      case 'people':
        const people = parseInt(userInput.trim());
        if (people >= 1 && people <= 20) {
          setBookingData(prev => ({ ...prev, numberOfPeople: userInput.trim() }));
          setBookingStep('date');

          const dateMessage: Message = {
            id: Date.now().toString(),
            text: `👥 Number of visitors: ${people}

📅 **When would you like to visit? Please provide the date (YYYY-MM-DD format):**

Example: 2025-09-20`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, dateMessage]);
        } else {
          const errorMessage: Message = {
            id: Date.now().toString(),
            text: `❌ Please provide a valid number of people (1-20).`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
        break;

      case 'date':
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(userInput.trim())) {
          const visitDate = new Date(userInput.trim());
          if (visitDate > new Date()) {
            setBookingData(prev => ({ ...prev, visitDate: userInput.trim() }));
            setBookingStep('requests');

            const requestsMessage: Message = {
              id: Date.now().toString(),
              text: `📅 Visit date: ${userInput.trim()}

📝 **Any special requests or requirements? (or type "none" if no special requests)**`,
              isUser: false,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, requestsMessage]);
          } else {
            const errorMessage: Message = {
              id: Date.now().toString(),
              text: `❌ Please provide a future date.`,
              isUser: false,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        } else {
          const errorMessage: Message = {
            id: Date.now().toString(),
            text: `❌ Please provide date in YYYY-MM-DD format (e.g., 2025-09-20).`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
        break;

      case 'requests':
        const requests = userInput.trim().toLowerCase() === 'none' ? '' : userInput.trim();
        setBookingData(prev => ({ ...prev, specialRequests: requests }));

        // Complete the booking
        await completeBooking(requests);
        break;
    }
  };

  const completeBooking = async (specialRequests: string) => {
    try {
      const bookingDetails: BookingInsert = {
        monastery_id: bookingData.monasteryId,
        user_id: user?.id || 'anonymous',
        email: bookingData.email,
        phone: bookingData.phone,
        number_of_people: parseInt(bookingData.numberOfPeople),
        visit_date: bookingData.visitDate,
        special_requests: specialRequests || null,
        status: 'pending' as const
      };

      const result = await createBooking(bookingDetails);

      const confirmationMessage: Message = {
        id: Date.now().toString(),
        text: `✅ **Booking Confirmed!**

🏛️ **Monastery:** ${bookingData.monasteryName}
📧 **Email:** ${bookingData.email}
📱 **Phone:** ${bookingData.phone}
👥 **Visitors:** ${bookingData.numberOfPeople}
📅 **Date:** ${bookingData.visitDate}
📝 **Requests:** ${specialRequests || 'None'}

📋 **Booking ID:** ${result.id}

You will receive a confirmation email shortly. The monastery staff will contact you if needed.

🙏 Thank you for choosing to explore Sikkim's sacred heritage!`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmationMessage]);

    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `❌ Sorry, there was an error processing your booking. Please try again or contact support.`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Reset booking flow
      setIsInBookingFlow(false);
      setBookingStep('');
      setBookingData({
        monasteryId: '',
        monasteryName: '',
        email: '',
        phone: '',
        numberOfPeople: '',
        visitDate: '',
        specialRequests: ''
      });
    }
  };

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Add typing indicator
    const typingIndicator: Message = {
      id: 'typing',
      text: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingIndicator]);

    try {
      // Ensure we have a conversation
      let convId = conversationId;
      if (!convId) {
        convId = await getOrCreateConversation();
        setConversationId(convId);
      }

      // Save user message to DB
      if (convId) {
        await saveMessage(convId, userMessage);
      }

      // Get last few messages for context
      const lastMessages = messages.slice(-5).concat(userMessage);

      // Call our RAG + Gemini service with conversation history
      const response = await processChatMessage(userMessage.text, lastMessages);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      // Remove typing indicator and add response
      setMessages(prev => prev.filter(msg => msg.id !== 'typing').concat(botResponse));

      // Save bot response to DB
      if (convId) {
        await saveMessage(convId, botResponse);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble processing your request right now. Please try asking about specific monasteries or Buddhist culture in Sikkim!",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => prev.filter(msg => msg.id !== 'typing').concat(errorResponse));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenHistory = async () => {
    await loadConversations();
    setIsSidebarVisible(true);
  };  const handleCloseHistory = () => {
    setIsSidebarVisible(false);
  };

  // Group conversations by date
  const groupConversationsByDate = (convs: { id: string; summary: string | null; updated_at: string; }[]) => {
    const grouped: { [key: string]: { id: string; summary: string | null; updated_at: string; }[] } = {};

    convs.forEach((conv: { id: string; summary: string | null; updated_at: string; }) => {
      const date = new Date(conv.updated_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;

      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(conv);
    });

    return grouped;
  };

  const groupedConversations = groupConversationsByDate(conversations);

  return (
    <SafeScreen backgroundColor="#FFFFFF" forceTopPadding>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 40}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerAvatar}>
              <Sparkles size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Monastery360 Guide</Text>
              <Text style={styles.headerSubtitle}>Monastery Expert Assistant</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleOpenHistory} style={styles.historyButton}>
            <History size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about monasteries, visits, culture..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

        {/* Chat History Sidebar */}
        <Modal
          visible={isSidebarVisible}
          animationType="slide"
          transparent
        >
          <View style={styles.sidebarContainer}>
            <View style={styles.sidebarContent}>
              <TouchableOpacity onPress={handleCloseHistory} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✖️</Text>
              </TouchableOpacity>
              <Text style={styles.sidebarTitle}>Chat History</Text>
              <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                {Object.entries(groupedConversations).map(([date, dateConversations]) => (
                  <View key={date}>
                    <Text style={styles.dateHeader}>{date}</Text>
                    {dateConversations.map((conversation) => (
                      <TouchableOpacity
                        key={conversation.id}
                        style={styles.historyItem}
                        onPress={() => handleSelectConversation(conversation.id)}
                      >
                        <Text style={styles.historyTime} numberOfLines={1}>
                          {conversation.summary || `Chat ${conversation.id.slice(0, 8)}`}
                        </Text>
                        <Text style={styles.historyItem}>
                          {new Date(conversation.updated_at).toLocaleTimeString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
                <TouchableOpacity style={styles.historyItem} onPress={handleNewChat}>
                  <Text style={styles.historyTime}>+ Start New Chat</Text>
                </TouchableOpacity>
                {conversations.length === 0 && !isLoadingConversations && (
                  <View style={styles.messagesList}>
                    <Text style={styles.emptyText}>No chat history yet</Text>
                    <Text style={styles.emptySubtext}>Start a conversation to see it here</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeScreen>
    );
  }

  const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DF8020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 120,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DF8020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#DF8020',
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#1F2937',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DF8020',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sidebarContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 50,
  },
  sidebarContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    height: Dimensions.get('window').height * 0.7,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  historyList: {
    flex: 1,
  },
  historyContent: {
    paddingBottom: 16,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DF8020',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  historyTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
