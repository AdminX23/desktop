import { git, envForAuthentication, expectedAuthenticationErrors, IGitExecutionOptions } from './core'
import { Repository } from '../../models/repository'
import { Account } from '../../models/account'
import { ChildProcess } from 'child_process'

const byline = require('byline')

/**
 * Push from the remote to the branch, optionally setting the upstream.
 * 
 * @param repository - The repository from which to push
 * 
 * @param account - The account to use when authenticating with the remote
 *
 * @param remote - The remote to push the specified branch to
 *
 * @param branch - The branch to push
 *
 * @param setUpstream - Whether or not to update the tracking information
 *                      of the specified branch to point to the remote.
 * 
 * @param progressCallback - An optional function which will be invoked
 *                           once per each line of output from Git. When
 *                           provided this also enables the '--progress'
 *                           command line flag for 'git push'.
 */
export async function push(repository: Repository, account: Account | null, remote: string, branch: string, setUpstream: boolean, progressCallback?: (line: string) => void): Promise<void> {
  const args = [ 'push', remote, branch ]
  if (setUpstream) {
    args.push('--set-upstream')
  }

  let options: IGitExecutionOptions = {
    env: envForAuthentication(account),
    expectedErrors: expectedAuthenticationErrors(),
  }

  if (progressCallback) {
    args.push('--progress')

    options = {
      ...options,
      processCallback: (process: ChildProcess) => {
        byline(process.stderr).on('data', (chunk: string) => {
          progressCallback(chunk)
        })
      },
    }
  }

  const result = await git(args, repository.path, 'push', options)

  if (result.gitErrorDescription) {
    throw new Error(result.gitErrorDescription)
  }
}
