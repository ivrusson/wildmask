import { Command } from 'commander';
import { error, info } from '../utils/output.js';

export function createCompletionCommand(): Command {
  return new Command('completion')
    .description('Generate shell completion scripts')
    .argument('[shell]', 'Shell type (bash, zsh, fish, powershell)', 'bash')
    .action((shell: string) => {
      const shellType = shell.toLowerCase();

      switch (shellType) {
        case 'bash':
          console.log(generateBashCompletion());
          info('\nTo install:');
          console.log('  wildmask completion bash > /usr/local/etc/bash_completion.d/wildmask');
          console.log('  # Or add to ~/.bashrc:');
          console.log('  eval "$(wildmask completion bash)"');
          break;

        case 'zsh':
          console.log(generateZshCompletion());
          info('\nTo install:');
          console.log('  wildmask completion zsh > ~/.zsh/completions/_wildmask');
          console.log('  # Or add to ~/.zshrc:');
          console.log('  eval "$(wildmask completion zsh)"');
          break;

        case 'fish':
          console.log(generateFishCompletion());
          info('\nTo install:');
          console.log('  wildmask completion fish > ~/.config/fish/completions/wildmask.fish');
          break;

        case 'powershell':
        case 'pwsh':
          console.log(generatePowerShellCompletion());
          info('\nTo install:');
          console.log('  wildmask completion powershell > wildmask.ps1');
          console.log('  # Add to your PowerShell profile');
          break;

        default:
          error(`Unsupported shell: ${shell}`);
          info('Supported shells: bash, zsh, fish, powershell');
          process.exit(1);
      }
    });
}

function generateBashCompletion(): string {
  return `# Bash completion for wildmask

_wildmask_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    # Main commands
    local commands="init config add remove rm list ls up down status check doctor tui serve serve-api install uninstall proxy smart-proxy completion help"

    # Options for specific commands
    case "\${COMP_WORDS[1]}" in
        init)
            opts="--domain --force"
            ;;
        add)
            opts="--target --port --protocol --domain --health-path --health-interval --no-health"
            ;;
        remove|rm)
            # Suggest mapping IDs/hosts from config
            opts=""
            ;;
        list|ls)
            opts="--json"
            ;;
        up)
            opts="--detach"
            ;;
        status)
            opts="--json"
            ;;
        doctor)
            opts="--fix --json"
            ;;
        serve)
            opts="--port --host --dir --name --add --protocol"
            ;;
        serve-api)
            opts="--port --host --name --add"
            ;;
        proxy|smart-proxy)
            opts="--port --host --pattern --add"
            ;;
        config)
            local config_cmds="edit show reset path validate export import"
            if [[ \${COMP_CWORD} -eq 2 ]]; then
                COMPREPLY=( \$(compgen -W "\${config_cmds}" -- \${cur}) )
                return 0
            fi
            ;;
        completion)
            opts="bash zsh fish powershell"
            COMPREPLY=( \$(compgen -W "\${opts}" -- \${cur}) )
            return 0
            ;;
    esac

    if [[ \${COMP_CWORD} -eq 1 ]]; then
        COMPREPLY=( \$(compgen -W "\${commands}" -- \${cur}) )
    else
        COMPREPLY=( \$(compgen -W "\${opts}" -- \${cur}) )
    fi
}

complete -F _wildmask_completion wildmask
`;
}

function generateZshCompletion(): string {
  return `#compdef wildmask

_wildmask() {
    local line state

    _arguments -C \\
        "1: :->cmds" \\
        "*::arg:->args"

    case $state in
        cmds)
            _values "wildmask command" \\
                "init[Initialize WildMask configuration]" \\
                "config[Manage configuration]" \\
                "add[Add a new DNS mapping]" \\
                "remove[Remove a DNS mapping]" \\
                "rm[Remove a DNS mapping]" \\
                "list[List all DNS mappings]" \\
                "ls[List all DNS mappings]" \\
                "up[Start the DNS daemon]" \\
                "down[Stop the DNS daemon]" \\
                "status[Show daemon status]" \\
                "check[Check connectivity to a mapping]" \\
                "doctor[Run system diagnostics]" \\
                "tui[Launch interactive TUI dashboard]" \\
                "serve[Launch a dummy HTTP server]" \\
                "serve-api[Launch a dummy API server]" \\
                "install[Install DNS resolver]" \\
                "uninstall[Uninstall DNS resolver]" \\
                "proxy[Start reverse proxy]" \\
                "smart-proxy[Start smart reverse proxy]" \\
                "completion[Generate completion scripts]" \\
                "help[Display help]"
            ;;
        args)
            case $line[1] in
                init)
                    _arguments \\
                        {--domain,-d}'[Domain TLD]:domain:' \\
                        {--force,-f}'[Overwrite existing configuration]'
                    ;;
                add)
                    _arguments \\
                        {--target,-t}'[Target IP]:ip:' \\
                        {--port,-p}'[Target port]:port:' \\
                        '--protocol[Protocol]:protocol:(http https tcp)' \\
                        {--domain,-d}'[Custom domain]:domain:' \\
                        '--health-path[Health check path]:path:' \\
                        '--health-interval[Health check interval]:seconds:' \\
                        '--no-health[Disable health checks]'
                    ;;
                config)
                    _values "config command" \\
                        "edit[Edit configuration]" \\
                        "show[Display configuration]" \\
                        "reset[Reset to defaults]" \\
                        "path[Show config path]" \\
                        "validate[Validate configuration]" \\
                        "export[Export configuration]" \\
                        "import[Import configuration]"
                    ;;
                doctor)
                    _arguments \\
                        '--fix[Attempt to fix issues]' \\
                        '--json[Output as JSON]'
                    ;;
                serve|serve-api)
                    _arguments \\
                        {--port,-p}'[Port]:port:' \\
                        {--host,-h}'[Host]:host:' \\
                        {--name,-n}'[Name]:name:' \\
                        '--add[Auto-add mapping]'
                    ;;
                completion)
                    _values "shell type" \\
                        "bash" "zsh" "fish" "powershell"
                    ;;
            esac
            ;;
    esac
}

_wildmask
`;
}

function generateFishCompletion(): string {
  return `# Fish completion for wildmask

# Main commands
complete -c wildmask -f -n "__fish_use_subcommand" -a "init" -d "Initialize configuration"
complete -c wildmask -f -n "__fish_use_subcommand" -a "config" -d "Manage configuration"
complete -c wildmask -f -n "__fish_use_subcommand" -a "add" -d "Add DNS mapping"
complete -c wildmask -f -n "__fish_use_subcommand" -a "remove" -d "Remove DNS mapping"
complete -c wildmask -f -n "__fish_use_subcommand" -a "rm" -d "Remove DNS mapping"
complete -c wildmask -f -n "__fish_use_subcommand" -a "list" -d "List mappings"
complete -c wildmask -f -n "__fish_use_subcommand" -a "ls" -d "List mappings"
complete -c wildmask -f -n "__fish_use_subcommand" -a "up" -d "Start daemon"
complete -c wildmask -f -n "__fish_use_subcommand" -a "down" -d "Stop daemon"
complete -c wildmask -f -n "__fish_use_subcommand" -a "status" -d "Show daemon status"
complete -c wildmask -f -n "__fish_use_subcommand" -a "check" -d "Check connectivity"
complete -c wildmask -f -n "__fish_use_subcommand" -a "doctor" -d "Run diagnostics"
complete -c wildmask -f -n "__fish_use_subcommand" -a "tui" -d "Launch TUI"
complete -c wildmask -f -n "__fish_use_subcommand" -a "serve" -d "Launch HTTP server"
complete -c wildmask -f -n "__fish_use_subcommand" -a "serve-api" -d "Launch API server"
complete -c wildmask -f -n "__fish_use_subcommand" -a "install" -d "Install DNS resolver"
complete -c wildmask -f -n "__fish_use_subcommand" -a "uninstall" -d "Uninstall DNS resolver"
complete -c wildmask -f -n "__fish_use_subcommand" -a "proxy" -d "Start reverse proxy"
complete -c wildmask -f -n "__fish_use_subcommand" -a "smart-proxy" -d "Start smart proxy"
complete -c wildmask -f -n "__fish_use_subcommand" -a "completion" -d "Generate completions"

# Options for init
complete -c wildmask -f -n "__fish_seen_subcommand_from init" -l domain -s d -d "Domain TLD"
complete -c wildmask -f -n "__fish_seen_subcommand_from init" -l force -s f -d "Overwrite existing"

# Options for add
complete -c wildmask -f -n "__fish_seen_subcommand_from add" -l target -s t -d "Target IP"
complete -c wildmask -f -n "__fish_seen_subcommand_from add" -l port -s p -d "Target port"
complete -c wildmask -f -n "__fish_seen_subcommand_from add" -l protocol -d "Protocol"
complete -c wildmask -f -n "__fish_seen_subcommand_from add" -l domain -s d -d "Custom domain"
complete -c wildmask -f -n "__fish_seen_subcommand_from add" -l no-health -d "Disable health checks"

# Config subcommands
complete -c wildmask -f -n "__fish_seen_subcommand_from config" -a "edit show reset path validate export import"

# Completion shells
complete -c wildmask -f -n "__fish_seen_subcommand_from completion" -a "bash zsh fish powershell"
`;
}

function generatePowerShellCompletion(): string {
  return `# PowerShell completion for wildmask

Register-ArgumentCompleter -Native -CommandName wildmask -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)

    $commands = @(
        'init', 'config', 'add', 'remove', 'rm', 'list', 'ls',
        'up', 'down', 'status', 'check', 'doctor', 'tui',
        'serve', 'serve-api', 'install', 'uninstall', 
        'proxy', 'smart-proxy', 'completion', 'help'
    )

    $commands | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }
}
`;
}

