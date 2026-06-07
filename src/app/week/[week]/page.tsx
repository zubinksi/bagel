import { redirect } from "next/navigation";
type Props = { params: Promise<{ week: string }> };
export default async function WeekPage({ params }: Props) {
  const { week } = await params;
  redirect(`/?week=${week}`);
}
