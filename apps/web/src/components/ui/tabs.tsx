"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

function Tabs({
	className,
	orientation = "horizontal",
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			data-orientation={orientation}
			className={cn(
				"group/tabs gap-2 data-[orientation=horizontal]:flex data-[orientation=horizontal]:flex-col data-[orientation=vertical]:flex",
				className,
			)}
			{...props}
		/>
	)
}

const tabsListVariants = cva(
	"group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
	{
		variants: {
			variant: {
				default: "bg-muted",
				line: "gap-1 bg-transparent",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
)

function TabsList({
	className,
	variant = "default",
	...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
	VariantProps<typeof tabsListVariants>) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			data-variant={variant}
			className={cn(tabsListVariants({ variant }), className)}
			{...props}
		/>
	)
}

function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				"relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				"data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30",
				"group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:border-b-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:text-primary group-data-[variant=line]/tabs-list:data-[state=active]:border-b-primary",
				className,
			)}
			{...props}
		/>
	)
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn("flex-1 outline-none", className)}
			{...props}
		/>
	)
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
