'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Target, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Sparkles,
  ArrowRight,
  Calendar,
  DollarSign,
  Globe
} from 'lucide-react';

interface CompanyDashboardProps {
  companyName: string;
  companyUrl?: string;
  userSolution?: string;
}

const aiPromptCards = [
  {
    id: 1,
    title: "Company Research & Analysis",
    description: "Get comprehensive insights about the company's business model, market position, and recent developments.",
    icon: Building2,
    color: "bg-blue-500",
    prompt: "Analyze this company's business model, market position, and recent developments to help me understand how my solution could benefit them."
  },
  {
    id: 2,
    title: "Prospect Persona Generation",
    description: "Identify key decision makers and create detailed personas for targeted outreach.",
    icon: Users,
    color: "bg-green-500",
    prompt: "Create detailed personas for key decision makers at this company who would be interested in my solution."
  },
  {
    id: 3,
    title: "Value Proposition Tailoring",
    description: "Customize your value proposition to address this company's specific pain points and opportunities.",
    icon: Target,
    color: "bg-purple-500",
    prompt: "Based on this company's profile, tailor my value proposition to address their specific pain points and business opportunities."
  },
  {
    id: 4,
    title: "Outreach Strategy & Messaging",
    description: "Generate personalized outreach messages and communication strategies.",
    icon: MessageSquare,
    color: "bg-orange-500",
    prompt: "Create personalized outreach messages and communication strategies for engaging with this company."
  },
  {
    id: 5,
    title: "Market Opportunity Assessment",
    description: "Evaluate the market opportunity and potential ROI for this prospect.",
    icon: TrendingUp,
    color: "bg-red-500",
    prompt: "Assess the market opportunity and potential ROI for this prospect based on their industry and business profile."
  }
];

export function CompanyDashboard({ companyName, companyUrl, userSolution }: CompanyDashboardProps) {
  const handlePromptClick = (prompt: string) => {
    // Here you would typically open an AI chat interface with the pre-filled prompt
    // console.log('Selected prompt:', prompt);
    // You could also store this in localStorage or state management for the AI chat
    localStorage.setItem('aiPrompt', prompt);
    // Redirect to AI chat or open modal
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                {companyName}
              </h1>
              <p className="text-gray-600 mt-1">
                AI-Powered Prospect Dashboard
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Ready
            </Badge>
          </div>
          
          {companyUrl && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Globe className="h-4 w-4" />
              <a 
                href={companyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {companyUrl}
              </a>
            </div>
          )}
        </div>

        {/* AI Prompt Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiPromptCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card key={card.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handlePromptClick(card.prompt)}
                    className="w-full"
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Insights
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Schedule Follow-up</p>
                    <p className="text-sm text-gray-500">Set reminders for outreach</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Estimate Value</p>
                    <p className="text-sm text-gray-500">Calculate potential deal size</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">View History</p>
                    <p className="text-sm text-gray-500">Past interactions & notes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
