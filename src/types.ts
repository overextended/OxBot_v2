import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ClientEvents,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type { BotClient } from '@/client';

export type SlashCommandData =
  | Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'>
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder;

export type SlashCommandExecute = (interaction: ChatInputCommandInteraction, client: BotClient) => Promise<void>;

export type ContextCommandExecute = (
  interaction: MessageContextMenuCommandInteraction,
  client: BotClient,
) => Promise<void>;

export type CommandAutocomplete = (interaction: AutocompleteInteraction, client: BotClient) => Promise<void>;

export type SlashCommand = {
  data: SlashCommandData;
  execute: SlashCommandExecute;
  executeContext?: never;
  autocomplete?: CommandAutocomplete;
};

export type ContextCommand = {
  data: ContextMenuCommandBuilder;
  executeContext: ContextCommandExecute;
  execute?: never;
  autocomplete?: never;
};

export type Command = SlashCommand | ContextCommand;

export interface BotEvent<T extends keyof ClientEvents> {
  name: T;
  once?: boolean;
  execute: (client: BotClient, ...args: ClientEvents[T]) => Promise<void>;
}
