import { Doc } from "./_generated/dataModel";

const MS_PER_DAY = 86_400_000;

/** Format a timestamp as YYYY-MM-DD in UTC. */
export function formatDateUTC(ts: number): string {
  return new Date(ts).toISOString().split("T")[0];
}

/** Build a deterministic signature string for a fetch target. */
export function buildSignature(fields: {
  origin: string;
  destination: string;
  departureDate: string;
  cabin: string;
  passengers: number;
  tripType: string;
  returnDate?: string;
}): string {
  return [
    fields.origin,
    fields.destination,
    fields.departureDate,
    fields.cabin,
    fields.passengers,
    fields.tripType,
    fields.returnDate ?? "",
  ].join("|");
}

/**
 * Given a route document and a "now" timestamp, compute all fetch-target
 * descriptors (one per day in the route's travel window).
 */
export function deriveFetchTargets(
  route: Pick<
    Doc<"routes">,
    | "origin"
    | "destination"
    | "tripType"
    | "windowStartDays"
    | "windowLengthDays"
    | "returnAfterDays"
    | "cabin"
    | "passengers"
  >,
  now: number
): Array<{
  signature: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  cabin: string;
  passengers: number;
  tripType: string;
}> {
  const targets: Array<{
    signature: string;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    cabin: string;
    passengers: number;
    tripType: string;
  }> = [];

  for (let i = 0; i < route.windowLengthDays; i++) {
    const dayOffset = route.windowStartDays + i;
    const departureDate = formatDateUTC(now + dayOffset * MS_PER_DAY);

    let returnDate: string | undefined;
    if (route.tripType === "round_trip" && route.returnAfterDays != null) {
      returnDate = formatDateUTC(
        now + (dayOffset + route.returnAfterDays) * MS_PER_DAY
      );
    }

    const descriptor = {
      origin: route.origin,
      destination: route.destination,
      departureDate,
      returnDate,
      cabin: route.cabin,
      passengers: route.passengers,
      tripType: route.tripType,
    };

    targets.push({
      ...descriptor,
      signature: buildSignature(descriptor),
    });
  }

  return targets;
}
