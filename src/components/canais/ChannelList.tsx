import { ChannelCard } from "@/components/canais/ChannelCard";
import type { MarketplaceChannel } from "@/lib/pricing/types";

export function ChannelList({ channels }: { channels: MarketplaceChannel[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {channels.map((channel) => (
        <ChannelCard key={channel.id} channel={channel} />
      ))}
    </div>
  );
}
