import { tool } from "ai";
import { z } from "zod";
import { logger } from "@/lib/observability/logger";

async function geocodeCity(
	city: string,
): Promise<{ latitude: number; longitude: number } | null> {
	try {
		const response = await fetch(
			`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
		);

		if (!response.ok) {
			return null;
		}

		const data = await response.json();

		if (!data.results || data.results.length === 0) {
			return null;
		}

		const result = data.results[0];
		return {
			latitude: result.latitude,
			longitude: result.longitude,
		};
	} catch {
		return null;
	}
}

export const getWeather = tool({
	description:
		"Get the current weather at a location. You can provide either coordinates or a city name.",
	inputSchema: z.object({
		latitude: z.number().optional(),
		longitude: z.number().optional(),
		city: z
			.string()
			.describe("City name (e.g., 'San Francisco', 'New York', 'London')")
			.optional(),
	}),
	needsApproval: true,
	execute: async (input) => {
		const log = logger.tool("getWeather", {
			city: input.city,
			latitude: input.latitude,
			longitude: input.longitude,
		});
		let latitude: number;
		let longitude: number;

		if (input.city) {
			const coords = await geocodeCity(input.city);
			if (!coords) {
				log.done({ error: "geocode_failed" });
				return {
					error: `Could not find coordinates for "${input.city}". Please check the city name.`,
				};
			}
			latitude = coords.latitude;
			longitude = coords.longitude;
		} else if (input.latitude !== undefined && input.longitude !== undefined) {
			latitude = input.latitude;
			longitude = input.longitude;
		} else {
			log.done({ error: "missing_location" });
			return {
				error:
					"Please provide either a city name or both latitude and longitude coordinates.",
			};
		}

		try {
			const response = await fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
			);

			const weatherData = await response.json();

			if ("city" in input) {
				weatherData.cityName = input.city;
			}

			log.done({ latitude, longitude });
			return weatherData;
		} catch (error) {
			log.error(error);
			return { error: `Failed to fetch weather: ${error}` };
		}
	},
});
