import { Link } from "@tanstack/react-router"
import { GalleryVerticalEnd } from "lucide-react"
import PublicLayout from "@/components/public-layout"
import { FieldDescription } from "@/components/ui/field"

export function PublicNotFound() {
	return (
		<PublicLayout>
			<div className="text-center flex flex-col gap-2 items-center">
				<Link to="/" className="flex flex-col items-center gap-2 font-medium">
					<div className="flex size-8 items-center justify-center rounded-md">
						<GalleryVerticalEnd className="size-6" />
					</div>
					<span className="sr-only">BIR Notebook.</span>
				</Link>
				<h1 className="text-xl font-bold">Page Not found</h1>
				<FieldDescription>
					Go <Link to="/">home</Link>.
				</FieldDescription>
			</div>
		</PublicLayout>
	)
}
