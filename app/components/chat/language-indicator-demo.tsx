"use client"

import { LanguageIndicator } from "./language-indicator"
import { LanguageScrollBar } from "./language-scroll-bar"
import { LanguageAutoScroll } from "./language-auto-scroll"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LanguageIndicatorDemo() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Language Indicator Variants</h1>
        <p className="text-muted-foreground">
          Choose the best variant to show multilingual search capabilities
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compact</CardTitle>
            <CardDescription>
              Perfect for chat input areas - minimal space usage
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LanguageIndicator variant="compact" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subtle</CardTitle>
            <CardDescription>
              Great for homepage - shows language names with context
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LanguageIndicator variant="subtle" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prominent</CardTitle>
            <CardDescription>
              Eye-catching version with examples in different languages
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LanguageIndicator variant="prominent" />
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Manual Scroll</CardTitle>
            <CardDescription>
              Horizontal scrollable bar showing all languages
            </CardDescription>
          </CardHeader>
          <CardContent className="py-8">
            <LanguageScrollBar variant="compact" />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Auto Scroll</CardTitle>
            <CardDescription>
              Continuously scrolling bar - perfect for homepage hero
            </CardDescription>
          </CardHeader>
          <CardContent className="py-8">
            <LanguageAutoScroll variant="compact" speed={45} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold">Usage Examples</h2>
        
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Homepage Onboarding</h3>
            <div className="bg-muted/20 rounded-lg p-6 text-center">
              <div className="mb-6">
                <LanguageAutoScroll variant="compact" speed={50} />
              </div>
              <h1 className="text-2xl font-medium mb-4">What's on your mind?</h1>
              <div className="mb-4">
                <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm">
                  Search together, free forever
                </span>
              </div>
              <LanguageIndicator variant="subtle" />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Chat Input Area</h3>
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="bg-background border rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm bg-muted px-2 py-1 rounded">Research: Moderate</span>
                    <LanguageIndicator variant="compact" />
                  </div>
                  <button className="bg-primary text-primary-foreground rounded-full p-2">
                    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 