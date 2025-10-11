import { EnvelopeSimple, Phone, Link, Globe } from "@phosphor-icons/react"
import React from "react"

export function LinkMarkdown({
  href,
  children,
  ...props
}: React.ComponentProps<"a">) {
  if (!href) return <span {...props}>{children}</span>

  // Detect link type
  const isMailto = href.startsWith("mailto:")
  const isTel = href.startsWith("tel:")
  const isInternal = href.startsWith("/") || href.startsWith("#")
  
  // Extract display information based on link type
  let displayText = ""
  let Icon = Globe
  let shouldOpenInNewTab = true
  
  if (isMailto) {
    displayText = href.replace("mailto:", "").split("?")[0] // Remove mailto: and query params
    Icon = EnvelopeSimple
    shouldOpenInNewTab = false // Let system handle mailto
  } else if (isTel) {
    displayText = href.replace("tel:", "").replace(/[^\d+\-\s()]/g, "") // Clean phone number
    Icon = Phone
    shouldOpenInNewTab = false // Let system handle tel
  } else if (isInternal) {
    displayText = href.split("/").pop()?.split("#").pop() || href
    Icon = Link
    shouldOpenInNewTab = false // Internal links shouldn't open new tabs
  } else {
    // External URL
    try {
      const url = new URL(href)
      displayText = url.hostname.replace("www.", "")
    } catch {
      displayText = href
    }
  }

  const linkProps = shouldOpenInNewTab 
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {}

  return (
    <a
      href={href}
      {...linkProps}
      className="bg-muted text-muted-foreground hover:bg-muted-foreground/30 hover:text-primary inline-flex h-5 max-w-fit items-center gap-1 rounded-full py-0 pr-2 pl-0.5 text-xs leading-none no-underline transition-colors duration-150"
      title={href}
    >
      {isMailto || isTel || isInternal ? (
        <span className="size-3.5 rounded-full bg-muted-foreground/20 inline-flex items-center justify-center">
          <Icon className="size-2.5" />
        </span>
      ) : (
        <>
          <img
            src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(href)}`}
            alt="favicon"
            width={14}
            height={14}
            className="size-3.5 rounded-full"
            onError={(e) => {
              // Fallback to globe icon if favicon fails
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <span className="size-3.5 rounded-full bg-muted-foreground/20 hidden inline-flex items-center justify-center">
            <Globe className="size-2.5" />
          </span>
        </>
      )}
      <span className="font-normal max-w-[200px] truncate">
        {displayText}
      </span>
    </a>
  )
}
