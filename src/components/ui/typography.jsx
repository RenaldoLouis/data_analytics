import { cn } from "@/lib/utils"

export function H1({ className, ...props }) {
    return (
        <h1
            className={cn(
                "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
                className
            )}
            {...props}
        />
    )
}

export function H2({ className, ...props }) {
    return (
        <h2
            className={cn(
                "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
                className
            )}
            {...props}
        />
    )
}

export function H3({ className, ...props }) {
    return (
        <h3
            className={cn("scroll-m-20 text-2xl font-semibold tracking-tight", className)}
            {...props}
        />
    )
}

export function H4({ className, ...props }) {
    return (
        <h4
            className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)}
            {...props}
        />
    )
}

export function P({ className, ...props }) {
    return (
        <p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)} {...props} />
    )
}

export function Lead({ className, ...props }) {
    return (
        <p className={cn("text-xl text-muted-foreground", className)} {...props} />
    )
}

export function Muted({ className, ...props }) {
    return (
        <p className={cn("text-sm text-muted-foreground", className)} {...props} />
    )
}

export function Small({ className, ...props }) {
    return (
        <small className={cn("text-sm font-medium leading-none block", className)} {...props} />
    )
}

export function Blockquote({ className, ...props }) {
    return (
        <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)} {...props} />
    )
}

export function InlineCode({ className, ...props }) {
    return (
        <code
            className={cn(
                "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
                className
            )}
            {...props}
        />
    )
}
