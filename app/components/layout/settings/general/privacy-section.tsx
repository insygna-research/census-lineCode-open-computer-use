"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheckIcon, ArrowSquareOutIcon } from "@phosphor-icons/react"

export function PrivacySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheckIcon className="size-5" />
          Privacy & Legal
        </CardTitle>
        <CardDescription>
          Review our privacy practices and legal information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Privacy Policy</h4>
          <p className="text-sm text-muted-foreground">
            Learn how we collect, use, and protect your data.
          </p>
          <Link href="/privacy" target="_blank">
            <Button variant="outline" size="sm" className="mt-2">
              View Privacy Policy
              <ArrowSquareOutIcon className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
        
        <div className="space-y-2 pt-2">
          <h4 className="text-sm font-medium">Data Security</h4>
          <p className="text-sm text-muted-foreground">
            Your API keys are encrypted with AES-256-GCM encryption. 
            We use Row Level Security to ensure your data remains private.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}